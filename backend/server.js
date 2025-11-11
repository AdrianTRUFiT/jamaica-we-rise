import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ Force a known stable Stripe API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

app.use(cors({ origin: "https://jamaica-we-rise.vercel.app" }));
app.use(express.json());

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy!" });
});

// ✅ Create Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount } = req.body;
    console.log("Creating checkout session for:", name, email, amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // ✅ Safe and simple
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Jamaica We Rise - Donation from ${name}` },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: "payment",
      customer_email: email,
      metadata: { donor_name: name },
      success_url: "https://jamaica-we-rise.vercel.app/success.html",
      cancel_url: "https://jamaica-we-rise.vercel.app",
    });

    console.log("✅ Stripe session created:", session.id);
    res.json({ id: session.id, url: session.url });

  } catch (err) {
    console.error("❌ Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Donation API running on port ${PORT}`);
  console.log("💳 Stripe Checkout ready.");
});
