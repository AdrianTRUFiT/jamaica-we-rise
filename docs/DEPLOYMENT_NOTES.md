# ⚙️ Deployment Notes — Jamaica We Rise × iAscendAi

## 🧭 Overview
This document explains how to set up, run, and maintain the **Jamaica We Rise** donation + identity system — from local development to full production deployment.

It covers:

- Environment setup  
- Backend configuration  
- Stripe integration  
- Local + cloud deployment  
- Troubleshooting  
- Security + maintenance  
- Validation checklists  

---

## 🧰 Requirements

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | ≥ 18.x | Required for backend |
| **npm** | ≥ 9.x | Install dependencies |
| **Stripe Account** | Test + Live Keys | Required for donations |
| **Git** | Optional | For version control / deployment |

---

## 🗂️ Folder Structure

jamaica-we-rise/
├── server.js
├── config.js
├── .env
├── package.json
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
│   ├── iascendai-dashboard.html
│   ├── iascendai-verify.html
│   ├── soulregistry.html
│   └── impact.html
└── docs/
├── API_REFERENCE.md
├── SYSTEM_OVERVIEW.md
└── DEPLOYMENT_NOTES.md

---

## 🔐 Environment Configuration (`.env`)

Create `.env` in your root folder:

============================

JAMAICA WE RISE — BACKEND

============================

MODE: test | production

MODE=test

—————————–

STRIPE CONFIGURATION

—————————–

STRIPE_SECRET_KEY=<your_test_or_live_secret_key>
STRIPE_PUBLISHABLE_KEY=<your_test_or_live_publishable_key>

—————————–

FRONTEND CONFIGURATION

—————————–

Local development:

FRONTEND_URL=http://127.0.0.1:3000

Production:

FRONTEND_URL=https://jamaica-we-rise.vercel.app

PORT=10000

Switch to live mode by changing:

MODE=production

---

## 🚀 Local Development Setup

### 1. Install dependencies
```bash
npm install

2. Start backend

node server.js

(Or with automatic reload:)

npx nodemon server.js

3. Run frontend

Open:

http://127.0.0.1:3000

4. Test donation

Use Stripe test card:

4242 4242 4242 4242
Exp: Any future date
CVC: 123
ZIP: Any


⸻

🌐 Deployment (Live)

⭐ Recommended Hosting Model

Backend: Render / Railway / Fly.io
Frontend: Vercel / Netlify / Cloudflare Pages

Steps:

1. Deploy Backend
	•	Create a new Web Service (Node environment)
	•	Upload your repository
	•	Add .env variables using Render/Railway dashboard
	•	Make sure:
	•	MODE=production
	•	PORT=10000
	•	STRIPE_SECRET_KEY is Live
	•	FRONTEND_URL=https://jamaica-we-rise.vercel.app

2. Deploy Frontend
	•	Upload your /public/ folder to Vercel or Netlify
	•	Ensure all paths match names exactly (case-sensitive)

3. Update config.js (already done)

export const CONFIG = {
  MODE: "production",
  BACKEND_URL: "https://your-render-url.onrender.com"
};


⸻

📜 Logs & Monitoring

File	Purpose
logs/access.log	All API hits
logs/error.log	Stripe errors + server crashes
logs/event.log	Donation verification + identity registrations

View logs in real time:

tail -f logs/access.log


⸻

⚠️ Troubleshooting Guide

Issue	Cause	Fix
Donation page won’t redirect	Wrong FRONTEND_URL	Set correct domain in .env
Success page shows blank data	session_id missing from URL	Ensure success_url uses {CHECKOUT_SESSION_ID}
SoulMark not showing	Wrong registry key (soulmark vs soulMark)	All frontend files now normalized
Dashboard empty	Registry not updating	Check file write permissions on Render
CORS error	Domain mismatch	Update backend CORS whitelist


⸻

🧩 Maintenance Notes

Clear logs periodically:

rm logs/*.log && touch logs/access.log logs/error.log logs/event.log

Backup registry regularly:

cp data/registry.json backups/registry_$(date +%F).json

Update safely
	1.	Switch to MODE=test
	2.	Push code
	3.	Validate Stripe test flow
	4.	Review logs
	5.	Switch to MODE=production

⸻

✅ Deployment Verification Checklist

Step	Status
.env configured	☐
Backend deployed	☐
FRONTEND_URL matches Vercel	☐
Stripe test donation successful	☐
SoulMark displayed in success.html	☐
Registration creates identity	☐
Dashboard shows live totals	☐
Registry lists new entries	☐


⸻

🔒 Security Recommendations
	•	Never commit .env to GitHub
	•	Rotate Stripe keys every 90 days
	•	Restrict backend CORS to known frontend domains
	•	Ensure registry.json cannot be overwritten publicly
	•	Use HTTPS always
	•	Monitor logs for repeated failed access attempts

⸻

🧠 Authored By

Adrian TRUFiT McKenzie
Founder — BizTech Wellness AI × iAscendAi
Builder of SoulMarkⓈ Integrity Infrastructure, Authored Intelligence, and VIBEⓈ-aligned digital verification systems.

---


