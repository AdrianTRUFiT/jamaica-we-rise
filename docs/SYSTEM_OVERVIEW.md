🌍 System Overview — Jamaica We Rise × iAscendAi

Updated: November 16, 2025

🎯 Purpose

The Jamaica We Rise system delivers a fully verifiable donation + identity infrastructure powered by SoulMarkⓈ and the iAscendAi Authored Identity Engine.

Every donation:
	•	Is processed through Stripe
	•	Is cryptographically verified
	•	Generates a permanent SoulMarkⓈ hash
	•	Is written to the public SoulRegistryⓈ

Every user:
	•	Can claim a username@iascendai
	•	Is stored as a verified identity in the same registry
	•	Can log in, view their identity, and verify others

The system is:
	•	Serverless on the frontend
	•	JSON-ledger based on the backend
	•	Secure, portable, and fully auditable

⸻

🧱 Core Components

Component	Description
server.js	The canonical backend: Stripe checkout, donation verification, SHA3-256 SoulMarkⓈ engine, identity registration, username checks, public registry, logging.
public/	All frontend HTML pages, fetch logic, UI steps, and identity/donation flows.
config.js	Global frontend config file for linking to the Render backend URL.
data/registry.json	Append-only ledger of donations + identities (no database needed).
logs/	Server-generated logs: access.log, error.log, event.log.
docs/	Internal documentation for API, deployment, and navigation.


⸻

📂 Folder Structure

jamaica-we-rise/
├── server.js
├── package.json
├── .env
├── data/
│   └── registry.json
├── logs/
│   ├── access.log
│   ├── error.log
│   └── event.log
├── public/
│   ├── index.html
│   ├── success.html
│   ├── iascendai-register.html
│   ├── iascendai-login.html
│   ├── iascendai-dashboard.html
│   ├── iascendai-verify.html
│   ├── soulregistry.html
│   ├── impact-dashboard.html
│   └── config.js
└── docs/
    ├── API_REFERENCE.md
    ├── SYSTEM_OVERVIEW.md
    └── DEPLOYMENT_NOTES.md


⸻

🔁 Data Flow Overview (FINAL & ACCURATE)

1. Donation (index.html)

User enters:
	•	Name
	•	Email
	•	Amount

Frontend calls:

POST /create-checkout-session

Backend:
	•	Creates Stripe checkout session
	•	Logs activity
	•	Redirects user to Stripe

⸻

2. Payment Success (success.html)

Stripe returns user with:

success.html?session_id={CHECKOUT_SESSION_ID}

Frontend calls backend:

GET /verify-donation/:sessionId

Backend:
	1.	Verifies Stripe payment
	2.	Generates SoulMarkⓈ hash (SHA3-256)
	3.	Writes donation entry to registry.json

Example stored entry:

{
  "type": "donation",
  "name": "John Doe",
  "email": "john@example.com",
  "amount": 50,
  "soulmark": "c8abf3...",
  "timestamp": "2025-11-16T10:15:00.000Z",
  "stripeSessionId": "cs_test_123"
}

Frontend stores:
	•	email
	•	amount
	•	soulmark

and continues → registration.

⸻

3. Registration (iascendai-register.html)

User chooses a username@iascendai.

Frontend checks:

GET /check-username/:username

If available → registers identity:

POST /register

Backend writes identity entry:

{
  "type": "identity",
  "username": "adrian",
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "role": "supporter",
  "soulmark": "c8abf3...",
  "donationAmount": 50,
  "displayIdentity": "username",
  "showDonationAmount": true,
  "createdAt": "2025-11-16T10:16:00.000Z"
}

User is redirected → dashboard.

⸻

4. Dashboard (iascendai-dashboard.html)

Reads identifier from:
	•	localStorage
or
	•	URL query ?username=xyz

Calls backend:

POST /lookup-identity

Displays:
	•	SoulMarkⓈ
	•	Full name
	•	Username@iascendai
	•	Verified status
	•	Created timestamp

This ensures the dashboard always reflects the canonical registry.

⸻

5. Impact Dashboard (impact-dashboard.html)

Calls:

GET /registry

Computes:
	•	Total Raised (sum of donation.amount)
	•	Total Donors (unique emails)
	•	Verified Identities (number of identity records)
	•	Recent donations (sorted by timestamp)

Useful for:
	•	Transparency
	•	Public reporting
	•	Live metrics on aid movement

⸻

6. SoulRegistry Directory (soulregistry.html)

Calls:

GET /registry

Displays all identity entries, sorted newest → oldest.

User sees:
	•	Username
	•	Display identity (name/username/anonymous)
	•	SoulMarkⓈ
	•	Verified status
	•	Timestamp

This page is effectively the public identity ledger.

⸻

7. SoulMarkⓈ Verification (iascendai-verify.html)

User enters a SoulMarkⓈ hash.

Frontend fetches:

GET /registry

Then:

Case A — Exact identity match

→ Shows verified identity, username, SoulMarkⓈ.

Case B — Donation-only match

→ SoulMarkⓈ valid, identity not yet registered.

Case C — No match

→ Returns invalid.

This is the core truth mechanism.

⸻

🧩 Core Technologies

Layer	Technology
Backend	Node.js + Express
Payments	Stripe Checkout Sessions
Auth Signature	SHA3-256 SoulMarkⓈ Engine
Storage	JSON ledger (registry.json)
Logging	File-based logs (FS append)
Frontend	Static HTML + JavaScript Fetch API
Hosting	Vercel (frontend) + Render (backend)


⸻

💡 Key Advantages

✅ Zero Database

Everything is stored in a portable JSON registry.

✅ Stripe-Verified

Each record is 100% payment-backed.

✅ SoulMarkⓈ Authorship

Identity cannot be duplicated or tampered with.

✅ Public Transparency

Every donation + identity is inspectable.

✅ Modular Architecture

Easily extendable to:
	•	SoulVaultⓈ
	•	FirstAidAI
	•	ThinkFuelAI
	•	Survivor pathways
	•	Geo-aid mapping

⸻

🔮 Future Extensions

Feature	Description
Survivor Identity Path	A second SoulMarkⓈ registration path for verified survivors.
Live Event Stream	Real-time registry viewer (WebSockets or SSE).
Geo Identity Layer	Attach approximate coordinates for verifying impacted regions.
Blockchain Mirror	Off-chain → on-chain registry syncing (optional).
Multi-currency Flow	Donation auto-conversion at verification time.


⸻

🧠 Authored By

Adrian TRUFiT McKenzie
Founder — BizTech Wellness AI × iAscendAi
Builder of SoulMarkⓈ Integrity Infrastructure, Authored Identity Systems, and Human-Verified Digital Aid Networks.

⸻

If you’re ready, I can now update:

✅ API_REFERENCE.md
or
✅ Navigation_Manifest YAML
or
✅ Produce a full downloadable /docs folder in one combined output.
