require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const morgan = require("morgan");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// --------------------------------------------------
// 🌍 CONFIGURATION
// --------------------------------------------------
const mode = (process.env.MODE || "test").toLowerCase();
const stripeSecretKey =
  mode === "live"
    ? process.env.STRIPE_LIVE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("❌ Stripe secret key missing for mode:", mode);
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const FRONTEND_URL = process.env.FRONTEND_URL || "https://jamaica-we-rise.vercel.app";

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
function logEvent(msg) {
  const logLine = `[${new Date().toISOString()}] ${msg}`;
  console.log(logLine);
  fs.appendFileSync(path.join(logsDir, "events.log"), logLine + "\n");
}

// --------------------------------------------------
// 💠 SOULMARKⓈ VERIFICATION
// --------------------------------------------------
app.post("/verify-soulmark", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required." });

    const soulmark =
      "0x" +
      crypto
        .createHash("sha256")
        .update(email)
        .digest("hex")
        .substring(0, 32)
        .toUpperCase();

    logEvent(`SoulMarkⓈ generated for ${email}: ${soulmark}`);
    res.json({ verified: true, soulmark });
  } catch (err) {
    console.error("❌ SoulMark verification error:", err);
    res.status(500).json({ error: "SoulMarkⓈ verification failed." });
  }
});

// --------------------------------------------------
// 💳 STRIPE DONATION ENDPOINT
// --------------------------------------------------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, amount } = req.body;
    if (!name || !email || !amount)
      return res.status(400).json({ error: "Missing fields." });

    const soulmark =
      "0x" +
      crypto
        .createHash("sha256")
        .update(email)
        .digest("hex")
        .substring(0, 32)
        .toUpperCase();

    // ✅ Stripe session with email prefill and redirect email passing
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
      mode: "payment",
      customer_email: email, // ✅ prefill Stripe checkout
      success_url: `${FRONTEND_URL}/impact.html?soulmark=${soulmark}&email=${encodeURIComponent(email)}`,
      cancel_url: `${FRONTEND_URL}/donate.html`,
      metadata: { name, email, soulmark },
    });

    // Log + Save to registry
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

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe session failed:", err);
    res.status(500).json({ error: "Stripe session failed." });
  }
});

// --------------------------------------------------
// 🧩 REGISTRATION + USERNAME CHECK ENDPOINTS
// --------------------------------------------------
app.get("/check-username/:username", (req, res) => {
  const { username } = req.params;
  const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const exists = data.some(
    (u) => (u.username || "").toLowerCase() === username.toLowerCase()
  );
  res.json({ available: !exists });
});

app.get("/check_name/:username", (req, res) => {
  const { username } = req.params;
  const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const exists = data.some(
    (u) => (u.username || "").toLowerCase() === username.toLowerCase()
  );
  res.json({ available: !exists });
});

app.post("/register", (req, res) => {
  try {
    const { name, email, username, role, soulmark } = req.body;
    if (!name || !email || !username || !role || !soulmark)
      return res.status(400).json({ error: "Missing registration fields." });

    const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const exists = data.some(
      (u) => (u.username || "").toLowerCase() === username.toLowerCase()
    );
    if (exists) return res.status(409).json({ error: "Username taken." });

    const entry = {
      name,
      email,
      username,
      role,
      soulmark,
      createdAt: new Date().toISOString(),
    };
    data.push(entry);
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));

    logEvent(`✅ Registered: ${username} (${role})`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Registration failed:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// --------------------------------------------------
// 📜 VIEW REGISTRY
// --------------------------------------------------
app.get("/registry", (req, res) => {
  const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  res.json(data);
});
// --------------------------------------------------
// 🧠 DASHBOARD FETCH ROUTE
// --------------------------------------------------
app.get("/user/:username", (req, res) => {
  try {
    const { username } = req.params;
    const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const user = data.find(
      (u) => (u.username || "").toLowerCase() === username.toLowerCase()
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      soulMark: user.soulmark,
      createdAt: user.createdAt,
      status: "Verified",
      location: user.location || null,
      statusMsg: user.status || null,
      assistance: user.assistance || null,
    });
  } catch (err) {
    console.error("❌ Dashboard fetch failed:", err);
    res.status(500).json({ error: "Failed to load user data" });
  }
});


// --------------------------------------------------
// 🩺 HEALTH CHECK
// --------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode,
    message: "Backend is healthy!",
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// 🌐 SERVE FRONTEND (STATIC FILES)
// --------------------------------------------------
const __dirnameResolved = path.resolve();
app.use(express.static(path.join(__dirnameResolved, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirnameResolved, "public", "donate.html"));
});

// --------------------------------------------------
// 🚀 SERVER START
// --------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🌍 Server running in ${mode.toUpperCase()} mode on port ${PORT}`);
});
