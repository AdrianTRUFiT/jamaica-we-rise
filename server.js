import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import Stripe from "stripe";

const app = express();
app.use(express.json());
app.use(cors());

// --------------------------------------------------
// ENV VARIABLES
// --------------------------------------------------
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://jamaica-we-rise.vercel.app";
const REGISTRY_PATH = process.env.REGISTRY_PATH || "/data/registry.json";
const LOG_DIR = process.env.LOG_DIR || "/data/logs";
const SOULMARK_SALT = process.env.SOULMARK_SALT || "default-salt";

// Ensure Stripe is initialized
const stripe = new Stripe(STRIPE_SECRET_KEY);

// --------------------------------------------------
// ENSURE DIRECTORIES & REGISTRY EXIST
// --------------------------------------------------

if (!fs.existsSync("/data")) {
  console.error("❌ /data does not exist — disk not mounted!");
}

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

if (!fs.existsSync(REGISTRY_PATH)) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify([]));
}

// --------------------------------------------------
// SOULMARK GENERATOR
// --------------------------------------------------
function generateSoulmark(email) {
  const base = `${email}-${Date.now()}-${SOULMARK_SALT}`;
  return Buffer.from(base).toString("base64url");
}

// --------------------------------------------------
// CHECK USERNAME AVAILABILITY
// --------------------------------------------------
app.get("/check-username/:username", (req, res) => {
  const users = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const exists = users.some(u => u.username === req.params.username);
  res.json({ available: !exists });
});

// --------------------------------------------------
// CREATE CHECKOUT SESSION
// --------------------------------------------------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Jamaica We Rise Donation" },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/success.html?soulmark={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel.html`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err);
    res.status(500).json({ error: "Stripe session failed" });
  }
});

// --------------------------------------------------
// VERIFY PAYMENT + REGISTER USER
// --------------------------------------------------
app.post("/verify-soulmark", async (req, res) => {
  try {
    const { sessionId, username } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not verified." });
    }

    const email = session.customer_email;
    const soulmark = generateSoulmark(email);

    // load registry
    const users = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));

    users.push({
      email,
      username,
      soulmark,
      timestamp: Date.now(),
    });

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(users, null, 2));

    res.json({ success: true, soulmark });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({ success: false });
  }
});

// --------------------------------------------------
// REGISTER USER WITHOUT PAYMENT (FALLBACK)
// --------------------------------------------------
app.post("/register", (req, res) => {
  try {
    const { email, username } = req.body;
    const soulmark = generateSoulmark(email);

    const users = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    users.push({ email, username, soulmark, timestamp: Date.now() });

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(users, null, 2));

    res.json({ success: true, soulmark });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ success: false });
  }
});

// --------------------------------------------------
// SERVER START
// --------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);