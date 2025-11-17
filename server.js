import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// FIXED CORS (CRITICAL)
app.use(
  cors({
    origin: [
      "https://jamaica-we-rise.vercel.app",
      "https://jamaica-we-rise-1.onrender.com",
      "http://localhost:4100",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

// Static path
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

// Stripe setup
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Registry Setup
const dataDir = "/data";
const registryFile = "/data/registry.json";

try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(registryFile)) {
    fs.writeFileSync(registryFile, JSON.stringify([]));
  }
} catch (err) {
  console.error("Disk setup error:", err);
}

// -------------------------- STRIPE SESSION --------------------------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, email } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
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
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: "Stripe session error" });
  }
});

// ------------------- REGISTRY / SOULMARK LOGGING --------------------
app.post("/verify-soulmark", (req, res) => {
  try {
    const entry = req.body;

    const registry = JSON.parse(fs.readFileSync(registryFile, "utf-8"));
    registry.push(entry);

    fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2));

    res.json({ success: true, registry });
  } catch (err) {
    console.error("Registry write error:", err);
    res.status(500).json({ error: "Registry write error" });
  }
});

// Diagnostic
app.get("/test", (req, res) => {
  res.json({ working: true, time: Date.now() });
});

// Root
app.get("/", (req, res) => {
  res.send("Jamaica We Rise backend is running.");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
