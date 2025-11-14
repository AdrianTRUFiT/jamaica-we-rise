# 🌍 Jamaica We Rise × iAscendAi  
### Authored-Intelligence Frontend & Verification Ecosystem

This repository hosts the **public frontend** and **static route layer** for the *Jamaica We Rise* initiative — a verified identity and donation infrastructure built on the iAscendAi framework.

---

## 🧭 Navigation & Flow  
All routes, backend endpoints, and verification logic are documented in:  
[`/docs/Navigation_Manifest_JamaicaWeRise.yaml`](./Navigation_Manifest_JamaicaWeRise.yaml)

| Stage | File | Description |
|-------|------|-------------|
| 💚 1. Donate | [`index.html`](../public/index.html) | Launch verified Stripe donation session |
| 🌟 2. Verify Payment | [`success.html`](../public/success.html) | Confirm Stripe payment + generate SoulMarkⓈ |
| 🧠 3. Register Identity | [`iascendai-register.html`](../public/iascendai-register.html) | Create username@iascendai + identity record |
| 🏠 4. Dashboard | [`iascendai-dashboard.html`](../public/iascendai-dashboard.html) | View SoulMarkⓈ, profile, and contributions |
| 🔗 5. Registry | [`soulregistry.html`](../public/soulregistry.html) | Browse public SoulMarkⓈ identities |
| 🔍 6. Verify SoulMark | [`iascendai-verify.html`](../public/iascendai-verify.html) | Check authenticity of a SoulMarkⓈ |
| 📈 7. Impact Metrics | [`impact-dashboard.html`](../public/impact-dashboard.html) | Real-time totals + transparency dashboard |
| 🌍 8. Live Tracker | [`tracker.html`](../public/tracker.html) | Donation progress + live feed (optional) |

---

## ⚙️ Configuration

Backend URL and environment mode are managed in:

```js
// config.js
export const CONFIG = {
  MODE: "production",
  BACKEND_URL: "https://jamaica-we-rise.onrender.com"
};


⸻

🚀 Deployment

Layer	Platform	URL
Frontend	Vercel	https://jamaica-we-rise.vercel.app
Backend	Render (Node + Express)	https://jamaica-we-rise.onrender.com

The Vercel deployment serves the static /public directory.
The Render deployment runs server.js and exposes all API endpoints.

⸻

🧩 Directory Layout

/public
  index.html
  success.html
  iascendai-register.html
  iascendai-dashboard.html
  tracker.html
  soulregistry.html
  iascendai-verify.html
  impact-dashboard.html
  config.js

/docs
  README.md
  Navigation_Manifest_JamaicaWeRise.yaml
  API_REFERENCE.md
  SYSTEM_OVERVIEW.md
  DEPLOYMENT_NOTES.md

/logs
  access.log
  events.log
  error.log


⸻

✅ Testing Flow (End-to-End)
	1.	Open index.html → submit donation.
	2.	Stripe checkout → complete payment.
	3.	Redirects to:

success.html?session_id=…


	4.	Page calls backend:

GET /verify-donation/:sessionId


	5.	SoulMarkⓈ appears → stored in registry.
	6.	Continue → iascendai-register.html.
	7.	Claim username → stored in registry.
	8.	Dashboard loads identity from registry.
	9.	Verify via:
	•	iascendai-verify.html
	•	soulregistry.html
	•	impact-dashboard.html

All pages consume the same backend:
https://jamaica-we-rise.onrender.com

⸻

🧠 Maintained By

Adrian TRUFiT McKenzie × BizTech Wellness AI
iAscendAi • Authored Systems Collective

⸻


🪄 Saved version intended for:
`C:\SoulVault\JamaicaWeRise\docs\README.md`


⸻
