🧙🏾‍♂️: Perfect. I will complete the entire API Reference in clean, professional developer-grade format — matching your iAscendAi ecosystem style and the final backend you approved.

Below is the full API Reference, fully aligned with your canonical server.js, using dark-themed clarity and structured YAML-style sections for immediate GitHub paste.

⸻

📘 Jamaica We Rise × iAscendAi — API Reference

Base URL:
http://localhost:10000
(or your Render deployment URL)

⸻

🧭 Overview

This API powers the SoulMarkⓈ-verified donation and identity system for Jamaica We Rise × iAscendAi.
It includes:
	•	Stripe checkout integration
	•	Verified donation record creation
	•	SoulMarkⓈ generation
	•	Username availability
	•	Identity registration
	•	Full public registry
	•	Legacy compatibility for Vercel redirect quirks

⸻

💳 Donation & Stripe Endpoints

⸻

POST /create-checkout-session

Creates a new Stripe Checkout session and returns the redirect URL.

Request Body

Field	Type	Required	Description
name	string	👍 Yes	Full name of donor
email	string	👍 Yes	Donor email (used by Stripe + SoulMark record)
amount	number	👍 Yes	Donation amount in USD
soulmark	string	No	Optional pre-assigned SoulMarkⓈ

Example Request

{
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "amount": 50
}

Response

{
  "id": "cs_test_123",
  "url": "https://checkout.stripe.com/pay/cs_test_123"
}


⸻

GET /retrieve-session?session_id=XYZ

🔁 Legacy compatibility endpoint used by success.html
Returns minimal Stripe session info (email, amount, soulmark).

Query Parameters

Key	Description
session_id	Stripe Checkout session ID

Response

{
  "amount": 100,
  "email": "donor@example.com",
  "soulmark": "SM-Z3JlZW5mbGFn"
}


⸻

GET /verify-donation/:sessionId

🔥 Canonical verification endpoint
Retrieves Stripe payment status and writes the donation to the SoulRegistryⓈ.

Path Parameters

Param	Description
sessionId	Stripe Checkout session ID

Response

{
  "verified": true,
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "amount": 50,
  "soulmark": "SM-Y3MtdGVzdC0xMjM",
  "timestamp": "2025-11-13T20:00:00.000Z",
  "stripeSessionId": "cs_test_123"
}


⸻

👤 Identity & Username Endpoints

⸻

GET /check-username/:username

Checks if a username is already registered.

Example

GET /check-username/adrian

Response

{ "available": true }


⸻

POST /register

Creates a verified iAscendAi identity after donation.

Request Body

Field	Required	Description
username	👍 Yes	New identity name (lowercase)
name	👍 Yes	Full name
email	👍 Yes	Email
role	👍 Yes	“supporter”
soulmark	Optional	SoulMark (auto-generated if missing)
donationAmount	Optional	Donation amount linked to identity

Example Request

{
  "username": "adrian",
  "name": "Adrian McKenzie",
  "email": "adrian@example.com",
  "role": "supporter",
  "soulmark": "SM-Y3MtdGVzdA"
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
    "soulmark": "SM-Y3MtdGVzdA",
    "createdAt": "2025-11-13T20:03:00.000Z"
  }
}


⸻

📚 Public Registry Endpoints

⸻

GET /registry

Returns all donation and identity entries.

Response Example

[
  {
    "type": "donation",
    "name": "John Doe",
    "email": "john@example.com",
    "amount": 50,
    "soulmark": "SM-abcdefghijkl",
    "timestamp": "2025-11-13T19:05:00.000Z"
  },
  {
    "type": "identity",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "supporter",
    "soulmark": "SM-abcdefghijkl",
    "createdAt": "2025-11-13T19:06:00.000Z"
  }
]


⸻

🩺 Health & Utility Endpoints

⸻

GET /health

Returns service status.

Response

{
  "status": "ok",
  "mode": "production",
  "timestamp": "2025-11-13T21:00:00Z",
  "frontend": "https://jamaica-we-rise.vercel.app"
}


⸻

🧪 QA Probe (Optional Local Testing)

If you included qa_probe.mjs, run:

node qa_probe.mjs

This hits:
	•	/health
	•	/create-checkout-session
	•	/check-username
	•	/donations/stats (not implemented, safe to remove)

⸻

