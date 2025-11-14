// server.js — Jamaica We Rise × iAscendAi
// Canonical Backend (Updated with displayIdentity + showDonationAmount)

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;
const __dirname = path.resolve();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Paths
const DATA_DIR = path.join(__dirname, "data");
const REGISTRY_FILE = path.join(DATA_DIR, "registry.json");

// Ensure registry exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(REGISTRY_FILE)) fs.writeFileSync(REGISTRY_FILE, "[]");

// Utility — Read registry JSON
function readRegistry() {
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Registry read error:", err);
    return [];
  }
}

// Utility — Write registry JSON
function writeRegistry(data) {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Registry write error:", err);
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, mode: "production", timestamp: Date.now() });
});

// Create Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Jamaica We Rise – Donation" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      metadata: { donor_name: name },
      success_url:
        `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/donate.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe session failed." });
  }
});

// Verify checkout session
app.get("/verify-soulmark", async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email = session.customer_details.email;
    const amount = session.amount_total / 100;

    const soulmark =
      "SM-" + Buffer.from(email).toString("base64").slice(0, 12);

    res.json({
      email,
      amount,
      soulmark,
      verified: true,
    });
  } catch (err) {
    console.error("SoulMark verify error:", err);
    res.status(400).json({ error: "Invalid session ID" });
  }
});

// Username availability check
app.get("/check-username/:username", (req, res) => {
  const { username } = req.params;
  const reg = readRegistry();

  const taken = reg.some(
    (r) =>
      r.type === "identity" &&
      r.username.toLowerCase() === username.toLowerCase()
  );

  res.json({ available: !taken });
});

// Register identity — UPDATED HERE
app.post("/register", (req, res) => {
  try {
    const {
      name,
      email,
      username,
      role,
      soulmark,
      donationAmount,
      displayIdentity,
      showDonationAmount,
    } = req.body;

    if (!name || !email || !username) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const reg = readRegistry();

    // Check if username taken
    if (
      reg.some(
        (r) =>
          r.type === "identity" &&
          r.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      return res.status(400).json({ error: "Username already taken." });
    }

    // Identity Record (UPDATED)
    const record = {
      type: "identity",
      username: username.toLowerCase(),
      name,
      email,
      role: role || "supporter",
      soulmark:
        soulmark ||
        "SM-" + Buffer.from(email).toString("base64").slice(0, 12),
      donationAmount: donationAmount || null,

      // NEW FIELDS — required for your display logic
      displayIdentity: displayIdentity || "username",
      showDonationAmount: showDonationAmount !== false,

      createdAt: new Date().toISOString(),
    };

    reg.push(record);
    writeRegistry(reg);

    res.json({ ok: true, identity: record });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Public donations + identities
app.get("/donations/stats", (req, res) => {
  const reg = readRegistry();
  const donations = reg.filter((r) => r.type === "donation");
  const identities = reg.filter((r) => r.type === "identity");

  res.json({
    donations,
    identities,
    totalDonations: donations.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    ),
  });
});

// Get user identity by username
app.get("/user/:username", (req, res) => {
  const { username } = req.params;
  const reg = readRegistry();

  const identity = reg.find(
    (r) =>
      r.type === "identity" &&
      r.username.toLowerCase() === username.toLowerCase()
  );

  if (!identity) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(identity);
});

// Start server
app.listen(PORT, () => {
  console.log(`Jamaica We Rise API running in PRODUCTION mode on port ${PORT}`);
});