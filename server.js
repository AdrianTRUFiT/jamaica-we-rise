// Jamaica We Rise Backend — Production Final
import dotenv from "dotenv"; dotenv.config();
import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import crypto from "crypto";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const MODE = process.env.MODE || "production";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
console.error("Missing STRIPE_SECRET_KEY");
process.exit(1);
}
const stripe = new Stripe(stripeKey);

const PORT = process.env.PORT || 10000;

const FRONTEND_URL =
process.env.FRONTEND_URL || "[https://jamaica-we-rise.vercel.app](https://jamaica-we-rise.vercel.app/)";

const REGISTRY_PATH =
process.env.REGISTRY_PATH || "./data/registry.json";

const LOG_DIR =
process.env.LOG_DIR || "./logs";

const SOULMARK_SALT =
process.env.SOULMARK_SALT || crypto.randomBytes(32).toString("hex");

const allowedOrigins = [
"[http://localhost:3000](http://localhost:3000/)",
"[http://127.0.0.1:3000](http://127.0.0.1:3000/)",
"[https://jamaica-we-rise.vercel.app](https://jamaica-we-rise.vercel.app/)",
"[https://jamaica-we-rise.onrender.com](https://jamaica-we-rise.onrender.com/)"
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
app.use(express.static("public"));

if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function logEvent(type, message) {
const line = `[${new Date().toISOString()}] [${type}] ${message}\\n`;
fs.appendFileSync(path.join(LOG_DIR, `${type}.log`), line);
}

function loadRegistry() {
return fs.existsSync(REGISTRY_PATH)
? JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"))
: [];
}

function saveRegistry(registry) {
fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function normalizeEmail(e) {
return e.toLowerCase().trim();
}

function generateSoulMark(email, timestamp) {
const nonce = crypto.randomBytes(32).toString("hex");
return crypto
.createHash("sha3-256")
.update(`${normalizeEmail(email)}${timestamp}${SOULMARK_SALT}${nonce}`)
.digest("hex");
}

// ---------------------------------------------------------
// HEALTH
// ---------------------------------------------------------
app.get("/health", (req, res) => {
res.json({
status: "ok",
mode: MODE,
timestamp: new Date().toISOString(),
frontend: FRONTEND_URL
});
});

// ---------------------------------------------------------
// STRIPE CHECKOUT SESSION
// ---------------------------------------------------------
app.post("/create-checkout-session", async (req, res) => {
try {
const { name, email, amount } = req.body;

```
if (!email || !amount) {
  return res.status(400).json({ error: "Missing email or amount" });
}

const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  customer_email: email,
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: { name: name || "Donation" },
        unit_amount: Math.round(amount * 100)
      },
      quantity: 1
    }
  ],
  mode: "payment",
  success_url: `${FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${FRONTEND_URL}/index.html`
});

logEvent("access", `Checkout created for ${email} → $${amount}`);
res.json({ url: session.url });

```

} catch (err) {
logEvent("error", `create-session: ${err.message}`);
res.status(500).json({ error: err.message });
}
});

// ---------------------------------------------------------
// VERIFY DONATION + CREATE DONATION RECORD
// ---------------------------------------------------------
app.get("/verify-donation/:sessionId", async (req, res) => {
const { sessionId } = req.params;

try {
const session = await stripe.checkout.sessions.retrieve(sessionId, {
expand: ["customer_details"]
});

if (!session || session.payment_status !== "paid") {
  return res.status(404).json({ error: "Not paid" });
}

const email = session.customer_details?.email;
const amount = session.amount_total / 100;
const timestamp = Math.floor(Date.now() / 1000);
const soulmark = generateSoulMark(email, timestamp);

const record = {
  type: "donation",
  name: session.customer_details?.name || "Anonymous",
  email: normalizeEmail(email),
  amount,
  soulmark,
  timestamp: new Date().toISOString(),
  stripeSessionId: sessionId
};

const registry = loadRegistry();
registry.push(record);
saveRegistry(registry);

logEvent(
  "event",
  `Verified donation ${email} → $${amount} / ${soulmark}`
);

res.json(record);

} catch (err) {
logEvent("error", `verify-donation: ${err.message}`);
res.status(500).json({ error: "Failed to verify" });
}
});

// ---------------------------------------------------------
// CHECK USERNAME AVAILABILITY
// ---------------------------------------------------------
app.get("/check-username/:username", (req, res) => {
const username = req.params.username.toLowerCase();
const registry = loadRegistry();

const exists = registry.some(
(r) => r.type === "identity" && r.username === username
);

res.json({ available: !exists });
});

// ---------------------------------------------------------
// REGISTER IDENTITY (ONE PER EMAIL RULE)
// ---------------------------------------------------------
app.post("/register", (req, res) => {
try {
const {
username,
name,
email,
role = "supporter",
soulmark,
donationAmount,
displayIdentity = "username",
showDonationAmount = true
} = req.body;

if (!username || !name || !email) {
  return res.status(400).json({ error: "Missing fields" });
}

const normEmail = normalizeEmail(email);
const registry = loadRegistry();

const emailExists = registry.some(
  (r) => r.type === "identity" && normalizeEmail(r.email) === normEmail
);
if (emailExists) {
  return res.status(400).json({ error: "Email already registered" });
}

const identityRecord = {
  type: "identity",
  username: username.toLowerCase(),
  name,
  email: normEmail,
  role,
  soulmark:
    soulmark ||
    generateSoulMark(email, Math.floor(Date.now() / 1000)),
  donationAmount: donationAmount || null,
  displayIdentity,
  showDonationAmount: !!showDonationAmount,
  createdAt: new Date().toISOString()
};

registry.push(identityRecord);
saveRegistry(registry);

logEvent("event", `Registered @${username}`);

res.json({ ok: true, user: identityRecord });

} catch (err) {
logEvent("error", `register: ${err.message}`);
res.status(500).json({ error: err.message });
}
});

// ---------------------------------------------------------
// VERIFY IDENTITY (SERVER-SIDE CHECK ONLY)
// ---------------------------------------------------------
app.post("/verify-identity", (req, res) => {
try {
const { email } = req.body;

if (!email) return res.status(400).json({ error: "Missing email" });

const norm = normalizeEmail(email);
const registry = loadRegistry();

const identity = registry.find(
  (r) => r.type === "identity" && normalizeEmail(r.email) === norm
);

if (!identity) return res.json({ valid: false });

res.json({
  valid: true,
  username: identity.username,
  name: identity.name,
  soulmark: identity.soulmark
});

} catch (err) {
logEvent("error", `verify-identity: ${err.message}`);
res.status(500).json({ error: "Failed" });
}
});

// ---------------------------------------------------------
// LOOKUP IDENTITY (username OR email)
// ---------------------------------------------------------
app.post("/lookup-identity", (req, res) => {
try {
const { identifier } = req.body;

if (!identifier) {
  return res.status(400).json({ error: "Missing identifier" });
}

const normalized = identifier.toLowerCase().trim();
const registry = loadRegistry();

const match = registry.find(
  (r) =>
    r.type === "identity" &&
    (r.username === normalized ||
      normalizeEmail(r.email) === normalized)
);

if (!match) {
  return res.status(404).json({ error: "Identity not found" });
}

res.json({ ok: true, user: match });

} catch (err) {
logEvent("error", `lookup: ${err.message}`);
res.status(500).json({ error: "Failed" });
}
});

// ---------------------------------------------------------
// PUBLIC REGISTRY ENDPOINT
// ---------------------------------------------------------
app.get("/registry", (req, res) => {
try {
const data = loadRegistry();
res.json(data);
} catch {
res.status(500).json({ error: "Failed to read registry" });
}
});

// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
app.listen(PORT, () => {
console.log(
`🌍 Jamaica We Rise API running in ${MODE.toUpperCase()} MODE on port ${PORT}`
);
});
