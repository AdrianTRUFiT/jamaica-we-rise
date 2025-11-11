require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const morgan = require("morgan");
const crypto = require("crypto");

const app = express();

// --------------------------------------------------
// 🌍 CONFIGURATION
// --------------------------------------------------
const mode = (process.env.MODE || "test").toLowerCase();
const stripeSecretKey =
  mode === "live"
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;

if (!stripeSecretKey) {
  console.error("❌ Stripe secret key missing for mode:", mode);
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

console.log("🧩 Stripe Mode:", mode, "| Key prefix:", stripeSecretKey.slice(0, 12));

// Express Middleware
app.use(express.json({ verify: (req, res, buf) => (req.rawBody = buf) }));
app.use(cors());

// --------------------------------------------------
// 🗂️ DIRECTORY SETUP
// --------------------------------------------------
const dataDir = path.join(__dirname, "data");
const logsDir = path.join(__dirname, "logs");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const registryPath = path.join(dataDir, "registry.json");
if (!fs.existsSync(registryPath)) fs.writeFileSync(registryPath, "[]");

// --------------------------------------------------
// 🧾 LOGGING
// --------------------------------------------------
app.use(morgan("tiny"));
function logEvent(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// --------------------------------------------------
// 💠 SOULMARKⓈ VERIFICATION
// --------------------------------------------------
app.post("/verify-soulmark", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required." });

    const soulmark =
      "0x" + crypto.createHash("sha256").update(email).digest("hex").substring(0, 32).toUpperCase();

    logEvent(`SoulMarkⓈ generated for ${email}: ${soulmark}`);
    res.json({ verified: true, soulmark });
  } catch (err) {
    console.error("⚠️ SoulMark verification failed:", err);
    res.status(500).json({ error: "SoulMarkⓈ verification failed." });
  }
});

// --------------------------------------------------
// 💳 CREATE STRIPE CHECKOUT SESSION
// --------------------------------------------------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount } = req.body;
    if (!name || !email || !amount)
      return res.status(400).json({ error: "Missing name, email, or amount." });

    const soulmark =
      "0x" + crypto.createHash("sha256").update(email).digest("hex").substring(0, 32).toUpperCase();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Jamaica We Rise Donation" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/impact.html?soulmark=${soulmark}`,
      cancel_url: `${process.env.FRONTEND_URL}/donate.html`,
      metadata: { name, email, soulmark },
    });

    const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    data.push({
      name,
      email,
      amount,
      soulmark,
      verified: true,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));

    logEvent(`Donation started: ${name} - $${amount} - ${email}`);
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: "Stripe session creation failed." });
  }
});

// --------------------------------------------------
// 🪄 STRIPE WEBHOOK: CONFIRM DONATION
// --------------------------------------------------
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { customer_email, amount_total, metadata } = session;

    const entry = {
      name: metadata.name,
      email: customer_email,
      amount: (amount_total / 100).toFixed(2),
      soulmark: metadata.soulmark,
      verified: true,
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    data.push(entry);
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));

    logEvent(`✅ Payment confirmed: ${metadata.name} — $${entry.amount}`);
  }

  res.json({ received: true });
});

// --------------------------------------------------
// 📜 REGISTRY FETCH
// --------------------------------------------------
app.get("/registry", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load registry." });
  }
});

// --------------------------------------------------
// 🚀 START SERVER
// --------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logEvent(`🌍 Server started in ${mode.toUpperCase()} mode on port ${PORT}`);
});
