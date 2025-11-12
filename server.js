// ✅ Jamaica We Rise Backend — Production-Ready (Final Stable Version)

// --- 1️⃣ Load environment first ---
import dotenv from "dotenv";
dotenv.config();

// --- 2️⃣ Core imports ---
import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import bodyParser from "body-parser";
import cors from "cors";

// --- 3️⃣ Initialize and configure ---
const app = express();
const MODE = process.env.MODE || "test";
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey || stripeKey.includes("xxx")) {
  console.error("❌ Stripe key missing or invalid. Check your .env or Render Environment Variables.");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
const REGISTRY_PATH = process.env.REGISTRY_PATH || "./data/registry.json";
const LOG_DIR = process.env.LOG_DIR || "./logs";

// --- 4️⃣ Middleware ---
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static("public")); // ✅ serve frontend files

// --- 5️⃣ Directory setup ---
if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// --- 6️⃣ Logging utility ---
function logEvent(type, message) {
  const logLine = `[${new Date().toISOString()}] [${type}] ${message}\n`;
  fs.appendFileSync(path.join(LOG_DIR, `${type}.log`), logLine);
}

// --- 7️⃣ Health check ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MODE,
    message: "Backend is healthy!",
    timestamp: new Date().toISOString()
  });
});

// --- 8️⃣ Create checkout session ---
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/donate.html`
    });

    logEvent("access", `Created checkout for ${email} $${amount}`);
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    logEvent("error", `create-session: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- 9️⃣ Verify donation session ---
app.get("/verify-session", async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: "Missing session_id" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session && session.payment_status === "paid") {
      const soulMark = "SM-" + Buffer.from(session.id).toString("base64").slice(0, 12);
      const record = {
        name: session.customer_details?.name || "Anonymous",
        email: session.customer_details?.email,
        amount: session.amount_total / 100,
        soulMark,
        timestamp: new Date().toISOString()
      };

      const registry = fs.existsSync(REGISTRY_PATH)
        ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
        : [];
      registry.push(record);
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

      logEvent("event", `Verified donation ${record.email} → ${record.soulMark}`);
      res.json({ verified: true, record });
    } else {
      res.json({ verified: false });
    }
  } catch (err) {
    console.error("Verify error:", err);
    logEvent("error", `verify-session: ${err.message}`);
    res.status(500).json({ error: "Server error verifying donation" });
  }
});

// --- 🔟 Username check ---
app.get("/check-username/:username", (req, res) => {
  try {
    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];
    const exists = registry.some(r => r.username === req.params.username);
    res.json({ available: !exists });
  } catch {
    res.json({ available: true });
  }
});

// --- 11️⃣ Register new user ---
app.post("/register", (req, res) => {
  try {
    const { username, name, email, soulMark } = req.body;
    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];
    const user = { username, name, email, soulMark, createdAt: new Date().toISOString() };
    registry.push(user);
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    logEvent("event", `Registered ${username} (${email})`);
    res.json({ ok: true, user });
  } catch (err) {
    logEvent("error", `register: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- 12️⃣ Donation stats ---
app.get("/donations/stats", (req, res) => {
  try {
    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];
    const donorCount = registry.length;
    const totalRaised = registry.reduce((sum, r) => sum + (r.amount || 0), 0);
    res.json({ donorCount, totalRaised });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ✅ Final server start ---
app.listen(PORT, () => {
  console.log(`✅ Jamaica We Rise API running in ${MODE.toUpperCase()} MODE on port ${PORT}`);
});
