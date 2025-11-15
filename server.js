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

// Small helper to safely read registry
function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (e) {
    logEvent("error", `readRegistry: ${e.message}`);
    return [];
  }
}

function writeRegistry(registry) {
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

    const registry = readRegistry();
    registry.push(donationRecord);
    writeRegistry(registry);

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
// Username Availability (one SoulNameⓈ per human/email)
// -------------------------------------------------
app.get("/check-username/:username", (req, res) => {
  const username = (req.params.username || "").toLowerCase();

  try {
    const registry = readRegistry();

    const exists = registry.some(
      (r) => r.type === "identity" && (r.username || "").toLowerCase() === username
    );

    res.json({ available: !exists });
  } catch (err) {
    logEvent("error", `check-username: ${err.message}`);
    res.json({ available: true });
  }
});

// -------------------------------------------------
// Login / Identity Lookup (by email or username)
// -------------------------------------------------
app.get("/lookup-identity", (req, res) => {
  const email = (req.query.email || "").toString().trim().toLowerCase();
  const username = (req.query.username || "").toString().trim().toLowerCase();

  if (!email && !username) {
    return res
      .status(400)
      .json({ error: "Missing email or username for lookup" });
  }

  try {
    const registry = readRegistry();

    const identity = registry.find((r) => {
      if (r.type !== "identity") return false;
      const u = (r.username || "").toLowerCase();
      const e = (r.email || "").toLowerCase();
      return (username && u === username) || (email && e === email);
    });

    if (!identity) {
      return res.json({ found: false });
    }

    // Do not expose email if not necessary in future; safe for now.
    return res.json({
      found: true,
      user: {
        username: identity.username,
        name: identity.name,
        email: identity.email,
        soulmark: identity.soulmark,
        role: identity.role,
        createdAt: identity.createdAt,
      },
    });
  } catch (err) {
    logEvent("error", `lookup-identity: ${err.message}`);
    res.status(500).json({ error: "Lookup failed" });
  }
});

// -------------------------------------------------
// Register Identity (ONE identity per email)
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

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const registry = readRegistry();

    // Enforce: one identity per email (one SoulNameⓈ per human for now)
    const existingByEmail = registry.find(
      (r) =>
        r.type === "identity" &&
        (r.email || "").toLowerCase() === normalizedEmail
    );

    if (existingByEmail && existingByEmail.username !== normalizedUsername) {
      return res.status(400).json({
        error:
          "An identity is already registered with this email. Please use your existing username or a different email.",
      });
    }

    // Also prevent duplicate username outright
    const existingByUsername = registry.find(
      (r) =>
        r.type === "identity" &&
        (r.username || "").toLowerCase() === normalizedUsername
    );

    if (existingByUsername && existingByUsername.email !== normalizedEmail) {
      return res.status(400).json({
        error:
          "This username is already taken by another identity. Please choose a different username.",
      });
    }

    const record = {
      type: "identity",
      username: normalizedUsername,
      name,
      email: normalizedEmail,
      role,
      soulmark:
        soulmark ||
        "SM-" + Buffer.from(normalizedEmail).toString("base64").slice(0, 12),
      donationAmount: donationAmount || null,
      displayIdentity: displayIdentity || "username",
      showDonationAmount:
        typeof showDonationAmount === "boolean" ? showDonationAmount : true,
      createdAt: new Date().toISOString(),
    };

    if (existingByEmail) {
      // Update existing record in-place if same email/username combo
      const idx = registry.indexOf(existingByEmail);
      registry[idx] = record;
    } else {
      registry.push(record);
    }

    writeRegistry(registry);

    logEvent("event", `Registered identity @${normalizedUsername}`);
    res.json({ ok: true, user: record });
  } catch (err) {
    logEvent("error", `register: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------
// Registry
// -------------------------------------------------
app.get("/registry", (req, res) => {
  try {
    const data = readRegistry();
    res.json(data);
  } catch (err) {
    logEvent("error", `registry: ${err.message}`);
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