// ✅ Jamaica We Rise Backend — FINAL PRODUCTION VERSION (Canonical: /verify-donation/:sessionId)

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import bodyParser from "body-parser";
import cors from "cors";

// -------------------------------------------------
// 1️⃣ Core Configuration
// -------------------------------------------------
const app = express();
const MODE = process.env.MODE || "production";
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error("❌ Missing STRIPE_SECRET_KEY in environment variables.");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

const PORT = process.env.PORT || 10000;

// 🚨 MUST be your Vercel frontend
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://jamaica-we-rise.vercel.app";

const REGISTRY_PATH = process.env.REGISTRY_PATH || "./data/registry.json";
const LOG_DIR = process.env.LOG_DIR || "./logs";

// -------------------------------------------------
// 2️⃣ Middleware
// -------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static("public")); // For local dev only

// -------------------------------------------------
// 3️⃣ Ensure folders exist
// -------------------------------------------------
if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// -------------------------------------------------
// 4️⃣ Logger
// -------------------------------------------------
function logEvent(type, message) {
  const line = `[${new Date().toISOString()}] [${type}] ${message}\n`;
  fs.appendFileSync(path.join(LOG_DIR, `${type}.log`), line);
}

// -------------------------------------------------
// 5️⃣ Health Check
// -------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MODE,
    timestamp: new Date().toISOString(),
    frontend: FRONTEND_URL
  });
});

// -------------------------------------------------
// 6️⃣ Create Stripe Checkout Session
// -------------------------------------------------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount, soulmark } = req.body;

    if (!email || !amount) {
      return res
        .status(400)
        .json({ error: "Missing required fields: email or amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: name || "Donation" },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: "payment",

      // 🚨 Redirect MUST go to Vercel frontend
      success_url: `${FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/index.html`,

      metadata: { soulmark }
    });

    logEvent("access", `Created checkout for ${email} → $${amount}`);
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    logEvent("error", `create-session: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------
// 7️⃣ CANONICAL ENDPOINT — Verify Donation
// -------------------------------------------------
app.get("/verify-donation/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId)
    return res.status(400).json({ error: "Missing sessionId" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details"]
    });

    if (!session)
      return res.status(404).json({ error: "Session not found" });

    const success = session.payment_status === "paid";

    const soulmark =
      session.metadata?.soulmark ||
      "SM-" + Buffer.from(session.id).toString("base64").slice(0, 12);

    const donationRecord = {
      type: "donation",
      name: session.customer_details?.name || "Anonymous",
      email: session.customer_details?.email,
      amount: session.amount_total / 100,
      soulmark,
      timestamp: new Date().toISOString(),
      stripeSessionId: sessionId
    };

    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];

    registry.push(donationRecord);
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

    logEvent(
      "event",
      `Verified donation ${donationRecord.email} → ${donationRecord.amount} / ${soulmark}`
    );

    res.json({
      verified: success,
      ...donationRecord
    });
  } catch (err) {
    logEvent("error", `verify-donation: ${err.message}`);
    res.status(500).json({ error: "Failed to verify donation" });
  }
});

// -------------------------------------------------
// 8️⃣ Username Availability
// -------------------------------------------------
app.get("/check-username/:username", (req, res) => {
  const username = req.params.username.toLowerCase();

  try {
    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];

    const exists = registry.some(
      (r) => r.type === "identity" && r.username === username
    );

    res.json({ available: !exists });
  } catch {
    res.json({ available: true });
  }
});

// -------------------------------------------------
// 9️⃣ Register Identity
// -------------------------------------------------
app.post("/register", (req, res) => {
  try {
    const { username, name, email, role, soulmark, donationAmount } = req.body;

    if (!username || !name || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];

    const record = {
      type: "identity",
      username: username.toLowerCase(),
      name,
      email,
      role,
      soulmark:
        soulmark ||
        "SM-" + Buffer.from(email).toString("base64").slice(0, 12),
      donationAmount: donationAmount || null,
      createdAt: new Date().toISOString()
    };

    registry.push(record);
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

    logEvent("event", `Registered identity @${username}`);
    res.json({ ok: true, user: record });
  } catch (err) {
    logEvent("error", `register: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------
// 🔟 Registry
// -------------------------------------------------
app.get("/registry", (req, res) => {
  try {
    const data = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : [];

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to read registry" });
  }
});

// -------------------------------------------------
// 1️⃣1️⃣ Start Server
// -------------------------------------------------
app.listen(PORT, () => {
  console.log(
    `🚀 Jamaica We Rise API running in ${MODE.toUpperCase()} MODE on port ${PORT}`
  );
});
