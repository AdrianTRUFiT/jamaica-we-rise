📘 Jamaica We Rise × iAscendAi — API Reference (Final, Updated)

Backend Version: Master Build — SHA3-256 SoulMark Engine
Last Updated: November 16, 2025
Base URL:

http://localhost:10000
https://jamaica-we-rise-backend.onrender.com


⸻

🧭 Overview

This API powers the SoulMarkⓈ-verified donation and identity engine for
Jamaica We Rise × iAscendAi.

It handles:
	•	🔐 SoulMarkⓈ generation (SHA3-256 + email + timestamp + salt + nonce)
	•	💳 Stripe Checkout sessions
	•	🧾 Verified donation records (registry.json)
	•	🧬 Identity Non-Multiplication Law
	•	👤 Username validation
	•	🪪 Identity creation
	•	📖 Public SoulRegistryⓈ
	•	🩺 Service health reporting

⸻

💳 Donation & Stripe Endpoints

⸻

POST /create-checkout-session

Creates a Stripe Checkout session and returns the redirect URL.

Request Body

Field	Type	Required	Description
name	string	✔️	Donor name
email	string	✔️	Donor email
amount	number	✔️	USD amount
soulmark	string	No	Ignored — backend generates SoulMark internally

Example Request

{
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "amount": 50
}

Response

{
  "url": "https://checkout.stripe.com/pay/cs_test_123"
}


⸻

GET /verify-donation/:sessionId

🔥 This is the canonical donation verification endpoint.
Retrieves the Stripe session, confirms payment, generates a SoulMarkⓈ, and writes the donation to registry.json.

Path Parameters

Parameter	Description
sessionId	Stripe Checkout session ID

Response

{
  "type": "donation",
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "amount": 50,
  "soulmark": "9f28d1f8eaa9f820c14c6a...",
  "timestamp": "2025-11-13T20:00:00.000Z",
  "stripeSessionId": "cs_test_123"
}


⸻

👤 Identity & Username Endpoints

⸻

GET /check-username/:username

Checks whether a username is available.

Example

GET /check-username/adrian

Response

{ "available": true }


⸻

POST /register

Creates a FULL verified iAscendAi identity.

Identity Non-Multiplication Law

An email can only produce ONE identity.
If the email already exists in the registry → registration is rejected.

Request Body

Field	Required	Description
username	✔️	Lowercase identity name
name	✔️	Full real name
email	✔️	Email (lowercased, normalized)
role	✔️	“supporter”
soulmark	No	If missing, backend generates a fresh SoulMarkⓈ
donationAmount	No	Amount tied to the identity
displayIdentity	No	“real”, “anonymous”, “username”
showDonationAmount	No	true/false

Example Request

{
  "username": "adrian",
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "role": "supporter"
}

Response

{
  "ok": true,
  "user": {
    "type": "identity",
    "username": "adrian",
    "name": "Adrian McKenzie",
    "email": "adrian@example.com",
    "role": "supporter",
    "soulmark": "9f28d1f8eaa9f820c14c...",
    "donationAmount": null,
    "displayIdentity": "username",
    "showDonationAmount": true,
    "createdAt": "2025-11-13T20:03:00.000Z"
  }
}


⸻

POST /lookup-identity

Lookup by email OR username.

Request

{ "identifier": "adrian@example.com" }

Response

{
  "ok": true,
  "user": { ... }
}


⸻

📚 Public Registry Endpoints

⸻

GET /registry

Returns all donation + identity records from registry.json.

Example Response

[
  {
    "type": "donation",
    "name": "John Doe",
    "email": "john@example.com",
    "amount": 50,
    "soulmark": "e3819e8f3d...",
    "timestamp": "2025-11-13T20:00:00.000Z"
  },
  {
    "type": "identity",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "supporter",
    "soulmark": "e3819e8f3d...",
    "createdAt": "2025-11-13T20:02:00.000Z"
  }
]


⸻

🩺 Health & Utility

⸻

GET /health

Basic API status check.

Response

{
  "status": "ok",
  "mode": "production",
  "timestamp": "2025-11-16T00:00:00Z",
  "frontend": "https://jamaica-we-rise.vercel.app"
}


⸻

🧪 Optional Local QA Probe

If you use qa_probe.mjs, it will test:
	•	/health
	•	/create-checkout-session
	•	/check-username
	•	/registry

Anything referencing non-existent endpoints should now be removed.

⸻

✅ API Reference Updated & Synced to Master Build

If you want, I can now rewrite:
	•	SYSTEM_OVERVIEW.md
	•	DEPLOYMENT_NOTES.md
	•	Navigation Manifest
	•	README.md
