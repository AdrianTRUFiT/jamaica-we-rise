🌍 Jamaica We Rise × iAscendAi

Authored-Intelligence Frontend & Verification Ecosystem

Updated: November 16, 2025

This repository contains the public frontend, identity flow, and verification layer for the Jamaica We Rise initiative — a SoulMarkⓈ-anchored donation and identity infrastructure built on the iAscendAi authored-intelligence framework.

It operates as the presentation layer for the backend identity engine hosted on Render.

⸻

🧭 Navigation & User Flow

All routes, verification steps, and API mappings are documented in:
📄 docs/Navigation_Manifest_JamaicaWeRise.yaml

Below is the live frontend route map:

Stage	File	Description
💚 1. Donate	public/index.html	Submit donation → Stripe checkout
🌟 2. Verify Payment	public/success.html	Retrieve session, generate SoulMarkⓈ
🧠 3. Register Identity	public/iascendai-register.html	Create username@iascendai
🔐 4. Login (Optional)	public/iascendai-login.html	Local access key → Dashboard
🏠 5. Dashboard	public/iascendai-dashboard.html	View SoulMarkⓈ, profile, and history
🔗 6. Registry	public/soulregistry.html	Public list of verified identities
🔍 7. Check SoulMark	public/iascendai-verify.html	Validate any SoulMarkⓈ
📈 8. Impact Metrics	public/impact-dashboard.html	Total donations, donors, activity feed
🌍 9. Live Tracker	(Optional) public/tracker.html	Donations + live registry feed

All pages use one unified backend:

https://jamaica-we-rise-backend.onrender.com


⸻

⚙️ Configuration

Frontend → backend mapping is controlled globally in:

// public/config.js
export const CONFIG = {
  BACKEND_URL: "https://jamaica-we-rise-backend.onrender.com"
};

No other file should hardcode a backend URL.

This keeps:
	•	Styling in one place
	•	Routing consistent
	•	Updates simple
	•	Vercel builds clean

⸻

🚀 Deployment

Layer	Platform	URL
Frontend	Vercel	https://jamaica-we-rise.vercel.app
Backend	Render (Node + Express)	https://jamaica-we-rise-backend.onrender.com

Vercel serves static assets from /public.

Render runs server.js with:
	•	SoulMark SHA3-256 engine
	•	Stripe verification
	•	Registry writes
	•	CORS rules
	•	Logging
	•	Identity Non-Multiplication Law

⸻

🧩 Directory Layout

/public
  index.html
  success.html
  iascendai-register.html
  iascendai-login.html
  iascendai-dashboard.html
  soulregistry.html
  iascendai-verify.html
  impact-dashboard.html
  config.js

/docs
  README.md
  API_REFERENCE.md
  SYSTEM_OVERVIEW.md
  Navigation_Manifest_JamaicaWeRise.yaml
  DEPLOYMENT_NOTES.md

/data
  registry.json

/logs
  access.log
  event.log
  error.log

Everything here reflects the current working system.

⸻

✅ End-to-End Testing Flow
	1.	User donates at index.html
	2.	Redirect to Stripe checkout
	3.	Successful payment → returns to:

success.html?session_id=cs_test_123

	4.	success.html calls:

GET /verify-donation/:sessionId

	5.	Backend verifies payment + generates SoulMarkⓈ
	6.	Donation record is written to data/registry.json
	7.	User continues to identity registration
	8.	POST /register stores username@iascendai identity
	9.	Dashboard loads verified identity + totals
	10.	Verification available via:
	•	iascendai-verify.html
	•	soulregistry.html
	•	impact-dashboard.html

All frontend pages communicate with:

https://jamaica-we-rise-backend.onrender.com


⸻

🧠 Maintained By

Adrian TRUFiT McKenzie
BizTech Wellness AI × iAscendAi
Architect of Authored Intelligence & SoulMarkⓈ Verification Systems

⸻

🪄 Saved To

C:\SoulVault\JamaicaWeRise\docs\README.md

⸻

If you’d like, I can now update:

📄 SYSTEM_OVERVIEW.md
or
📄 Navigation_Manifest_JamaicaWeRise.yaml
