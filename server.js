// Jamaica We Rise Backend — Production

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

const MODE = process.env.MODE || "production";
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error("❌ Missing STRIPE_SECRET_KEY in environment variables.");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const PORT = process.env.PORT || 10000;

// Frontend + storage paths
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://jamaica-we-rise.vercel.app";

const REGISTRY_PATH = process.env.REGISTRY_PATH || "./data/registry.json";
const LOG_DIR = process.env.LOG_DIR || "./logs";

// -------------------------------------------------
// CORS
// -------------------------------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://jamaica-we-rise.vercel.app",
  "https://jamaica-we-rise.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(bodyParser.json());

// Static for local dev only
app.use(express.static("public"));

// -------------------------------------------------
// Ensure folders exist
// -------------------------------------------------
if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// -------------------------------------------------
// Logger
// -------------------------------------------------
function logEvent(type, message) {
  const line = `[${new Date().toISOString()}] [${type}] ${message}\n`;
  fs.appendFileSync(path.join(LOG_DIR, `${type}.log`), line);
}

// Helper to load / save registry
function loadRegistry() {
  return fs.existsSync(REGISTRY_PATH)
    ? JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
    : [];
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

// -------------------------------------------------
// Health Check
// -------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MODE,
    timestamp: new Date().toISOString(),
    frontend: FRONTEND_URL,
  });
});

// -------------------------------------------------
// Create Stripe Checkout Session
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
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/index.html`,
      metadata: { soulmark },
    });

    logEvent("access", `Created checkout for ${email} → $${amount}`);
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    logEvent("error", `create-session: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------
// Verify Donation (canonical)
// -------------------------------------------------
app.get("/verify-donation/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details"],
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

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
      stripeSessionId: sessionId,
    };

    const registry = loadRegistry();
    registry.push(donationRecord);
    saveRegistry(registry);

    logEvent(
      "event",
      `Verified donation ${donationRecord.email} → ${donationRecord.amount} / ${soulmark}`
    );

    res.json({
      verified: success,
      ...donationRecord,
    });
  } catch (err) {
    logEvent("error", `verify-donation: ${err.message}`);
    res.status(500).json({ error: "Failed to verify donation" });
  }
});

// -------------------------------------------------
// Username Availability — one SoulNameⓈ per human
// -------------------------------------------------
app.get("/check-username/:username", (req, res) => {
  const username = req.params.username.toLowerCase();

  try {
    const registry = loadRegistry();

    const exists = registry.some(
      (r) => r.type === "identity" && r.username === username
    );

    res.json({ available: !exists });
  } catch {
    res.json({ available: true });
  }
});

// -------------------------------------------------
// Register Identity
// -------------------------------------------------
app.post("/register", (req, res) => {
  try {
    const {
      username,
      name,
      email,
      role,
      soulmark,
      donationAmount,
      displayIdentity,
      showDonationAmount,
    } = req.body;

    if (!username || !name || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const registry = loadRegistry();

    const existingIdentity = registry.find(
      (r) => r.type === "identity" && r.username === username.toLowerCase()
    );
    if (existingIdentity) {
      return res
        .status(409)
        .json({ error: "This username is already registered." });
    }

    const lowerUsername = username.toLowerCase();
    const soulName = `${lowerUsername}@iascendai`;

    const record = {
      type: "identity",
      soulName,
      username: lowerUsername,
      name,
      email,
      role,
      soulmark:
        soulmark ||
        "SM-" + Buffer.from(email).toString("base64").slice(0, 12),
      donationAmount: donationAmount || null,
      displayIdentity: displayIdentity || "username",
      showDonationAmount:
        typeof showDonationAmount === "boolean" ? showDonationAmount : true,
      authDevices: [],
      createdAt: new Date().toISOString(),
    };

    registry.push(record);
    saveRegistry(registry);

    logEvent("event", `Registered identity @${lowerUsername}`);
    res.json({ ok: true, user: record });
  } catch (err) {
    logEvent("error", `register: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------
// Device Auth — Register Device for SoulNameⓈ
// -------------------------------------------------
app.post("/auth/register-device", (req, res) => {
  try {
    const { username, deviceId, deviceLabel } = req.body;

    if (!username || !deviceId) {
      return res
        .status(400)
        .json({ error: "Missing username or deviceId" });
    }

    const registry = loadRegistry();
    const lowerUsername = username.toLowerCase();

    const identity = registry.find(
      (r) => r.type === "identity" && r.username === lowerUsername
    );

    if (!identity) {
      return res.status(404).json({ error: "Identity not found" });
    }

    if (!Array.isArray(identity.authDevices)) {
      identity.authDevices = [];
    }

    const existingDevice = identity.authDevices.find(
      (d) => d.deviceId === deviceId
    );

    if (!existingDevice) {
      identity.authDevices.push({
        deviceId,
        deviceLabel: deviceLabel || "Unknown Device",
        createdAt: new Date().toISOString(),
      });
      saveRegistry(registry);
      logEvent(
        "event",
        `Registered device for @${lowerUsername} (${deviceLabel || "device"})`
      );
    }

    res.json({
      ok: true,
      soulName: identity.soulName,
      username: identity.username,
      authDevices: identity.authDevices,
    });
  } catch (err) {
    logEvent("error", `auth-register-device: ${err.message}`);
    res.status(500).json({ error: "Failed to register device" });
  }
});

// -------------------------------------------------
// Device Auth — Login with Device
// -------------------------------------------------
app.post("/auth/login-device", (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: "Missing deviceId" });
    }

    const registry = loadRegistry();

    const identity = registry.find(
      (r) =>
        r.type === "identity" &&
        Array.isArray(r.authDevices) &&
        r.authDevices.some((d) => d.deviceId === deviceId)
    );

    if (!identity) {
      return res.status(404).json({ error: "No identity linked to this device" });
    }

    const sessionToken =
      "sess_" +
      Buffer.from(
        `${identity.username}:${Date.now().toString()}:${Math.random()
          .toString(36)
          .slice(2)}`
      ).toString("base64");

    logEvent(
      "event",
      `Device login for @${identity.username} via deviceId=${deviceId}`
    );

    res.json({
      ok: true,
      token: sessionToken,
      soulName: identity.soulName,
      username: identity.username,
      role: identity.role || "supporter",
    });
  } catch (err) {
    logEvent("error", `auth-login-device: ${err.message}`);
    res.status(500).json({ error: "Failed to login with device" });
  }
});

// -------------------------------------------------
// Registry
// -------------------------------------------------
app.get("/registry", (req, res) => {
  try {
    const data = loadRegistry();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to read registry" });
  }
});

// -------------------------------------------------
// Start Server
// -------------------------------------------------
app.listen(PORT, () => {
  console.log(
    `🚀 Jamaica We Rise API running in ${MODE.toUpperCase()} MODE on port ${PORT}`
  );
});