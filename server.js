import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// PUBLIC DIR FOR HTML FILES
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

// STRIPE SETUP
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ENSURE LOG FOLDERS EXIST (inside /data)
const dataDir = "/data";
const logsDir = "/data/logs";

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const registryFile = "/data/registry.json";
if (!fs.existsSync(registryFile)) {
  fs.writeFileSync(registryFile, JSON.stringify([]));
}

// CREATE CHECKOUT SESSION
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Jamaica We Rise Donation" },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: "Stripe session error" });
  }
});

// VERIFY SOULMARK + SAVE REGISTRY
app.post("/verify-soulmark", (req, res) => {
  try {
    const entry = req.body;

    const registry = JSON.parse(fs.readFileSync(registryFile, "utf-8"));
    registry.push(entry);
    fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2));

    res.json({ success: true, registry });
  } catch (err) {
    res.status(500).json({ error: "Registry write error" });
  }
});

// HEALTH CHECK
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ⚠️ THIS IS THE FIX
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});