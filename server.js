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
// CORS (FIXED)
// -------------------------------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://jamaica-we-rise.vercel.app",
  "https://jamaica-we-rise.onrender.com"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
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

// Small helpers to safely load/save registry
function loadRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return [];
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    logEvent("error", `loadRegistry: ${err.message}`);
    return [];
  }
}

function saveRegistry(data) {
  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    logEvent("error", `saveRegistry: ${err.message}`);
  }
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
      // default visibility (can be updated later by /register)
      displayIdentity: "real",
      showDonationAmount: true
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
// Username Availability
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

    const lowerUsername = username.toLowerCase();
    const identityMode = displayIdentity || "username";
    const showAmountFlag =
      typeof showDonationAmount === "boolean" ? showDonationAmount : true;

    // 1️⃣ Load registry
    const registry = loadRegistry();

    // 2️⃣ Compute the public name for donations based on identity mode
    let donationPublicName;
    if (identityMode === "anonymous") {
      donationPublicName = "Anonymous";
    } else if (identityMode === "real") {
      donationPublicName = name;
    } else {
      // default → username handle
      donationPublicName = `${lowerUsername}@iascendai`;
    }

    // 3️⃣ Build identity record (full, internal truth)
    const identityRecord = {
      type: "identity",
      username: lowerUsername,
      name,
      email,
      role,
      soulmark:
        soulmark ||
        "SM-" + Buffer.from(email).toString("base64").slice(0, 12),
      donationAmount: donationAmount || null,
      displayIdentity: identityMode,      // "username" | "real" | "anonymous"
      showDonationAmount: showAmountFlag, // true | false
      createdAt: new Date().toISOString(),
    };

    // 4️⃣ Update the matching donation record for public display
    //    Match first by soulmark, then by email as a fallback
    const identitySoulmark = identityRecord.soulmark;

    let donationIndex = registry.findIndex(
      (r) => r.type === "donation" && r.soulmark === identitySoulmark
    );

    if (donationIndex === -1) {
      // fallback: latest donation by email
      donationIndex = [...registry]
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => r.type === "donation" && r.email === email)
        .sort((a, b) => {
          const ta = new Date(a.r.timestamp || 0).getTime();
          const tb = new Date(b.r.timestamp || 0).getTime();
          return tb - ta;
        })[0]?.idx ?? -1;
    }

    if (donationIndex !== -1) {
      const donation = registry[donationIndex];

      // Apply public-facing identity rules
      donation.name = donationPublicName;
      donation.displayIdentity = identityMode;
      donation.showDonationAmount = showAmountFlag;

      // If anonymous, do not expose email publicly
      if (identityMode === "anonymous") {
        donation.email = "—";
      }

      // Keep the raw amount as-is for now, but add a publicAmount field
      // so the frontend can choose how to render it later.
      if (!showAmountFlag) {
        donation.publicAmount = null; // hide on public tracker when supported
      } else {
        donation.publicAmount = donation.amount;
      }

      registry[donationIndex] = donation;
      logEvent(
        "event",
        `Updated donation visibility for ${donation.email} → mode=${identityMode}, showAmount=${showAmountFlag}`
      );
    }

    // 5️⃣ Append identity record
    registry.push(identityRecord);
    saveRegistry(registry);

    logEvent("event", `Registered identity @${lowerUsername}`);
    res.json({ ok: true, user: identityRecord });
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