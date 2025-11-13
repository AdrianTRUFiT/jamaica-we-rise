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
const FRONTEND_URL = process.env.FRONTEND_URL || "https://jamaica-we-rise.onrender.com";
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
    timestamp: new Date().toISOString(),
  });
});

// --- 8️⃣ Create checkout session ---
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount, soulmark } = req.body;
    if (!email || !amount)
      return res.status(400).json({ error: "Missing required fields: email or amount" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: name || "Donation" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/success.html?session_id={{CHECKOUT_SESSION_ID}}`,
      cancel_url: `${FRONTEND_URL}/donate.html`,
      metadata: { soulmark },
    });

    logEvent("access", `Created checkout for ${email} → $${amount}`);
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    logEvent("error", `create-session: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- 9️⃣ Verify donation session (frontend success.html uses this) ---
app.get("/verify-session", async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: "Missing session_id" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session && session.payment_status === "paid") {
      const soulMark =
        session.metadata?.soulmark ||
        "SM-" + Buffer.from(session.id).toString("base64").slice(0, 12);

      const record = {
        name: session.customer_details?.name || "Anonymous",
        email: session.customer_details?.email,
        amount: session.amount_total / 100,
        soulMark,
        verified: true,
        timestamp: new Date().toISOString(),
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

// --- 🔟 SoulMark verification helper (legacy support) ---
app.post("/verify-soulmark", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ verified: false, error: "Missing email" });

  const soulmark = "SM-" + Buffer.from(email).toString("base64").slice(0, 10);
  logEvent("access", `Verified SoulMarkⓈ for ${email} → ${soulmark}`);
  res.json({ verified: true, soulmark });
});

// ✅ Alias to prevent 404 errors between verify-session and verify-soulmark
app.get("/verify-soulmark", async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });
  res.redirect(`/verify-session?session_id=${session_id}`);
});

// --- 11️⃣ Username check ---
app.get("/check-username/:username", (req, res) => {
  try {
    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];
    const exists = registry.some((r) => r.username === req.params.username);
    res.json({ available: !exists });
  } catch {
    res.json({ available: true });
  }
});

// --- 12️⃣ Register new user ---
app.post("/register", (req, res) => {
  try {
    const { username, name, email, role, soulmark } = req.body;

    if (!username || !name || !email || !role) {
      console.log("⚠️ Missing fields:", { username, name, email, role });
      return res.status(400).json({ error: "Missing registration fields" });
    }

    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];

    const user = {
      username,
      name,
      email,
      role,
      soulmark: soulmark || "SM-" + Buffer.from(email).toString("base64").slice(0, 10),
      verified: true,
      createdAt: new Date().toISOString(),
    };

    registry.push(user);
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

    logEvent("event", `Registered ${username} (${email})`);
    res.json({ ok: true, user });
  } catch (err) {
    logEvent("error", `register: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- 13️⃣ Donation stats ---
app.get("/donations/stats", (req, res) => {
  try {
    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];
    const donorCount = registry.filter((r) => r.amount).length;
    const totalRaised = registry.reduce((sum, r) => sum + (r.amount || 0), 0);
    res.json({ donorCount, totalRaised });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 14️⃣ Backend status JSON (for external monitoring) ---
app.get("/backend-status.json", (req, res) => {
  res.json({
    project: "Jamaica We Rise",
    mode: MODE,
    stripe: !!stripeKey,
    frontend: FRONTEND_URL,
    registry_exists: fs.existsSync(REGISTRY_PATH),
    timestamp: new Date().toISOString(),
  });
});

// --- ✅ Final server start ---
app.listen(PORT, () => {
  console.log(`✅ Jamaica We Rise API running in ${MODE.toUpperCase()} MODE on port ${PORT}`);
});
