// =============================================================
//  JAMAICA WE RISE — TEMPORARY CLEAN DEPLOY VERSION
//  (NO /data writes → allows Render to upgrade instance)
// =============================================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import crypto from "crypto";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// ----------------------------
// CONFIG
// ----------------------------
const MODE = process.env.MODE || "production";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://jamaica-we-rise.vercel.app";

// *** TURN OFF all disk paths for now ***
const REGISTRY_PATH = "/tmp/registry.json"; // temp in-memory path
const SOULMARK_SALT =
  process.env.SOULMARK_SALT ||
  crypto.randomBytes(32).toString("hex");

if (!STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 10000;

// Allowed CORS
const allowedOrigins = [
  FRONTEND_URL,
  "https://jamaica-we-rise.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// ----------------------------
// MIDDLEWARE
// ----------------------------
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());
app.use(bodyParser.json());

// ----------------------------
// SAFE LOGGER (console only)
// ----------------------------
function logEvent(type, msg) {
  console.log(`[${type}] ${msg}`);
}

// ----------------------------
// TEMP REGISTRY (Memory-based)
// ----------------------------
let memoryRegistry = [];

function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    }
  } catch (e) {}
  return memoryRegistry;
}

function saveRegistry(data) {
  memoryRegistry = data; // no disk writes
}

// ----------------------------
// HELPERS
// ----------------------------
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function generateSoulMark(email, timestamp) {
  const nonce = crypto.randomBytes(32).toString("hex");
  return crypto
    .createHash("sha3-256")
    .update(`${normalizeEmail(email)}${timestamp}${SOULMARK_SALT}${nonce}`)
    .digest("hex");
}

// =============================================================
// HEALTH CHECK
// =============================================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MODE,
    timestamp: new Date().toISOString(),
    frontend: FRONTEND_URL,
  });
});

// =============================================================
// 1. CREATE STRIPE CHECKOUT SESSION
// =============================================================
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Missing email or amount." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: name || "Donation" },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/index.html`,
    });

    logEvent("access", `Checkout created for ${email} → $${amount}`);
    res.json({ url: session.url });
  } catch (err) {
    logEvent("error", `create-session: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// 2. VERIFY DONATION
// =============================================================
app.get("/verify-donation/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details"],
    });

    if (!session || session.payment_status !== "paid") {
      return res.status(404).json({ error: "Payment not completed." });
    }

    const email = session.customer_details?.email;
    const amount = session.amount_total / 100;

    const timestamp = Math.floor(Date.now() / 1000);
    const soulmark = generateSoulMark(email, timestamp);

    const record = {
      type: "donation",
      name: session.customer_details?.name || "Anonymous",
      email: normalizeEmail(email),
      amount,
      soulmark,
      timestamp: new Date().toISOString(),
      stripeSessionId: sessionId,
    };

    const registry = loadRegistry();
    registry.push(record);
    saveRegistry(registry);

    logEvent("event", `Donation verified ${email} → $${amount} / ${soulmark}`);
    res.json(record);
  } catch (err) {
    logEvent("error", `verify-donation: ${err.message}`);
    res.status(500).json({ error: "Verification failed" });
  }
});

// =============================================================
// 3. CHECK USERNAME
// =============================================================
app.get("/check-username/:username", (req, res) => {
  const username = req.params.username.toLowerCase();
  const registry = loadRegistry();

  const exists = registry.some(
    (r) => r.type === "identity" && r.username === username
  );

  res.json({ available: !exists });
});

// =============================================================
// 4. REGISTER IDENTITY
// =============================================================
app.post("/register", (req, res) => {
  try {
    const {
      username,
      name,
      email,
      role = "supporter",
      soulmark,
      donationAmount,
      displayIdentity = "username",
      showDonationAmount = true,
    } = req.body;

    if (!username || !name || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const normEmail = normalizeEmail(email);
    const registry = loadRegistry();

    const existing = registry.find(
      (r) => r.type === "identity" && normalizeEmail(r.email) === normEmail
    );

    if (existing) {
      return res.status(400).json({
        error: "Identity already exists. Log in instead.",
      });
    }

    const userRecord = {
      type: "identity",
      username: username.toLowerCase(),
      name,
      email: normEmail,
      role,
      soulmark:
        soulmark || generateSoulMark(normEmail, Math.floor(Date.now() / 1000)),
      donationAmount: donationAmount || null,
      displayIdentity,
      showDonationAmount: !!showDonationAmount,
      createdAt: new Date().toISOString(),
    };

    registry.push(userRecord);
    saveRegistry(registry);

    logEvent("event", `Identity created @${username}`);
    res.json({ ok: true, user: userRecord });
  } catch (err) {
    logEvent("error", `register: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// 5. LOOKUP IDENTITY
// =============================================================
app.post("/lookup-identity", (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "Missing identifier." });
    }

    const norm = identifier.toLowerCase().trim();
    const registry = loadRegistry();

    const match = registry.find(
      (r) =>
        r.type === "identity" &&
        (r.username === norm || normalizeEmail(r.email) === norm)
    );

    if (!match) {
      return res.status(404).json({ error: "Identity not found." });
    }

    res.json({ ok: true, user: match });
  } catch (err) {
    logEvent("error", `lookup-identity: ${err.message}`);
    res.status(500).json({ error: "Lookup failed" });
  }
});

// =============================================================
// 6. REGISTRY DUMP (memory-only)
// =============================================================
app.get("/registry", (req, res) => {
  try {
    res.json(loadRegistry());
  } catch (err) {
    res.status(500).json({ error: "Failed to read registry." });
  }
});

// =============================================================
// START SERVER
// =============================================================
app.listen(PORT, () => {
  console.log(`🚀 Jamaica We Rise API running on port ${PORT}`);
});