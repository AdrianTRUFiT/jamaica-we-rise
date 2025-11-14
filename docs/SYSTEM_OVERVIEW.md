Here is the corrected and final SYSTEM_OVERVIEW.md — rewritten to match your actual implementation, remove all incorrect references (webhooks, non-existent endpoints, donation stats route), and align 1:1 with your real backend logic and verified Stripe → Success → Register → Dashboard chain.

No commentary.
No explanation.
Just the full corrected file for GitHub.

⸻


# 🌍 System Overview — Jamaica We Rise × iAscendAi

## 🎯 Purpose
The **Jamaica We Rise** system provides a transparent, verifiable donation and identity registry powered by **SoulMarkⓈ** and the **iAscendAi Authored Identity Network**.  
Donations are verified through Stripe and permanently written into a public-facing registry that also stores identity records, username claims, and SoulMarkⓈ hashes.

---

## 🧱 Core Components

| Component | Description |
|-----------|-------------|
| **server.js** | Canonical backend: Stripe payments, donation verification, identity registration, username availability, registry output. |
| **config.js** | Frontend-side config for loading the correct Render backend URL. |
| **data/registry.json** | Append-only ledger containing donation and identity entries. |
| **logs/** | Auto-generated: `access.log`, `error.log`, `events.log`. |
| **public/** | All user-facing HTML pages + JS logic. |
| **docs/** | Developer documentation for API, deployment, and navigation. |

---

## 📂 Folder Structure

jamaicawerise/
├── server.js
├── config.js
├── .env
├── data/
│   └── registry.json
├── logs/
│   ├── access.log
│   ├── error.log
│   └── events.log
├── public/
│   ├── index.html
│   ├── success.html
│   ├── iascendai-register.html
│   ├── iascendai-dashboard.html
│   ├── iascendai-verify.html
│   ├── soulregistry.html
│   └── impact-dashboard.html
└── docs/
├── API_REFERENCE.md
├── SYSTEM_OVERVIEW.md
└── DEPLOYMENT_NOTES.md

---

## 🔁 Data Flow Overview (Accurate & Canonical)

### **1. Donation (index.html)**
- User enters **name, email, amount**
- Calls:

POST /create-checkout-session

- Backend creates Stripe checkout session
- Stripe → Redirects user to payment page

---

### **2. Payment Success (success.html)**
- Stripe redirects back with:

success.html?session_id={CHECKOUT_SESSION_ID}

- Frontend calls:

GET /verify-donation/:sessionId

- Backend:
- Retrieves Stripe session
- Confirms payment
- Generates **SoulMarkⓈ**
- Writes donation record to registry.json:
  ```json
  {
    "type": "donation",
    "name": "...",
    "email": "...",
    "amount": 50,
    "soulmark": "SM-...",
    "timestamp": "...",
    "stripeSessionId": "..."
  }
  ```
- Frontend stores:
- donor_email  
- donor_soulmark  
- donation_amount  

---

### **3. Registration (iascendai-register.html)**
- Autofills from:
- query params  
- localStorage  

- Validates:

GET /check-username/:username

- Registers identity via:

POST /register

- Backend writes identity record:
```json
{
  "type": "identity",
  "username": "adrian",
  "name": "Adrian McKenzie",
  "email": "...",
  "role": "supporter",
  "soulmark": "SM-...",
  "donationAmount": 50,
  "createdAt": "..."
}

	•	Redirects user → dashboard.

⸻

4. Dashboard (iascendai-dashboard.html)

Reads user identity from:
	•	URL params
	•	OR localStorage

Fetches registry:

GET /registry

Displays:
	•	SoulMarkⓈ hash
	•	Name
	•	Username@iascendai
	•	Verified status
	•	Registered timestamp

⸻

5. Impact Dashboard

Page loads registry:

GET /registry

Computes:
	•	totalRaised
	•	donorCount
	•	verifiedCount
	•	recent donations
	•	recent identities

Refreshes every 20 seconds.

⸻

6. SoulRegistry (global public ledger)

Calls:

GET /registry

	•	Shows every entry (donation + identity)
	•	Verified users displayed first
	•	Lists SoulMarkⓈ, username, role, amount, and timestamp

⸻

7. SoulMarkⓈ Verification Page

User enters SoulMarkⓈ string.

Page:
	•	Fetches registry
	•	Finds exact soulmark match
	•	Displays result

⸻

🧩 Core Technologies

Layer	Technology
Backend	Node.js + Express
Payments	Stripe Checkout Sessions
Storage	JSON file ledger (registry.json)
Frontend	Static HTML + JS Fetch
Auth Verification	SoulMarkⓈ signature system
Logging	FS log writers (access, error, events)


⸻

💡 Key Advantages
	•	Zero Database → Fully portable system
	•	Stripe-verified → All donations cryptographically trustworthy
	•	SoulMarkⓈ layer → Identity is tied to authorship
	•	Registry-based → All data permanently stored and auditable
	•	Modular → Can plug into SoulVaultⓈ, ThinkFuelAI, or FirstAidAI

⸻

🔮 Future Extensions

Feature	Description
Verified Survivor Role	Add second pathway for survivors requesting aid
Realtime Feed	Event-stream updates for dashboard
Geo-Linked Identity	Optional location-layer for authenticated survivors
Multi-currency	Auto-conversion on donation capture
Off-chain Sync	Registry mirror into blockchain or IPFS


⸻

🧠 Authored By

Adrian TRUFiT McKenzie
Founder — BizTech Wellness AI × iAscendAi
Built to demonstrate human-authored identity, SoulMarkⓈ authenticity, and verifiable aid infrastructure.

---

If you'd like, I can now produce:

✅ `API_REFERENCE.md`  
✅ `DEPLOYMENT_NOTES.md`  
✅ Full `/docs` folder as a downloadable manifest  
✅ Version-stamped `README.md` for GitHub  

Just say: **“Generate full docs folder.”**