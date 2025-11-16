⚙️ Deployment Notes — Jamaica We Rise × iAscendAi (FINAL)

Updated: November 16, 2025
Aligned to Master Backend Build (SoulMark SHA3-256 Engine)

⸻

🧭 Overview

This document explains how to install, run, deploy, and maintain the Jamaica We Rise × iAscendAi system:
	•	Backend setup
	•	Environment variables (.env)
	•	Stripe integration
	•	Local development
	•	Production deployment (Render + Vercel)
	•	Logs & monitoring
	•	File structure
	•	Troubleshooting
	•	Security practices
	•	Deployment verification

Everything here matches the final server.js you approved.

⸻

🧰 Requirements

Tool	Version	Notes
Node.js	≥ 18.x	Required for backend
npm	≥ 9.x	Dependency management
Stripe Account	Test + Live Keys	Required for donations
Git	Optional	Deployment & version control


⸻

🗂️ Folder Structure (Correct)

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

🔐 Environment Configuration (.env)

Create .env in your project ROOT:

###############################
# JAMAICA WE RISE — BACKEND
###############################

MODE=production
PORT=10000

###############################
# STRIPE CONFIGURATION
###############################
STRIPE_SECRET_KEY=sk_live_xxx

###############################
# FRONTEND CONFIGURATION
###############################
FRONTEND_URL=https://jamaica-we-rise.vercel.app

###############################
# SOULMARK ENGINE SETTINGS
###############################
SOULMARK_SALT=<secure_random_32_bytes>

###############################
# REGISTRY + LOGS
###############################
REGISTRY_PATH=./data/registry.json
LOG_DIR=./logs


⸻

🚀 Local Development Setup

1. Install dependencies

npm install

2. Start backend

node server.js

Or with auto reload:

npx nodemon server.js

3. Frontend

Open:

http://127.0.0.1:3000

4. Test Stripe donation

Use test card:

4242 4242 4242 4242
Exp: any future date  
CVC: 123  
ZIP: any  


⸻

🌐 Live Deployment Model (Recommended)

Backend → Render
Frontend → Vercel

⸻

1. Deploy Backend (Render)

Steps:
	1.	Create Web Service
	2.	Select Node environment
	3.	Connect GitHub repo
	4.	Add your environment variables in Render dashboard
	5.	Set Node version ≥18
	6.	Set build and start commands:
	•	Build: npm install
	•	Start: node server.js

Required production env vars:

MODE=production
STRIPE_SECRET_KEY=sk_live_xxx
FRONTEND_URL=https://jamaica-we-rise.vercel.app
REGISTRY_PATH=./data/registry.json
LOG_DIR=./logs
SOULMARK_SALT=<secure_random_32_bytes>


⸻

2. Deploy Frontend (Vercel)

Vercel config (already correct):

public/
└── index.html
└── *.html
└── config.js   <-- points to BACKEND_URL

Vercel automatically publishes everything inside /public.

⸻

3. Update config.js

(This is the single source of truth for frontend URL → backend)

export const CONFIG = {
  BACKEND_URL: "https://jamaica-we-rise-backend.onrender.com"
};


⸻

📜 Logs & Monitoring

File	Purpose
logs/access.log	Every API hit
logs/error.log	Stripe errors / crashes
logs/event.log	Donation + identity events

View logs live:

tail -f logs/access.log
tail -f logs/event.log
tail -f logs/error.log


⸻

⚠️ Troubleshooting Guide (FINAL)

Issue	Cause	Fix
Donation page not redirecting	Wrong FRONTEND_URL	Update .env
Success page blank	Missing session_id	Ensure success_url uses {CHECKOUT_SESSION_ID}
Identity not saving	Registry file missing	Ensure data/registry.json exists
Dashboard empty	Registry not writing	Check Render file system permissions
CORS errors	Domain mismatch	Update CORS whitelist in backend
SoulMark missing	Wrong key on frontend	All pages now use soulmark (lowercase)


⸻

🧩 Maintenance Notes

Clear logs

rm logs/*.log
touch logs/access.log logs/error.log logs/event.log

Backup registry

cp data/registry.json backups/registry_$(date +%F).json

Safe Update Procedure
	1.	Set MODE to test
	2.	Push changes
	3.	Run Stripe test donation
	4.	Verify SoulMark + registry
	5.	Switch back to production

⸻

✅ Deployment Verification Checklist

Step	Status
.env configured	☐
Backend deployed	☐
FRONTEND_URL correct	☐
Stripe donation works	☐
SoulMark appears on success.html	☐
Registration → identity saved	☐
Dashboard stats update	☐
SoulRegistry shows new entries	☐


⸻

🔒 Security Recommendations
	•	Do NOT commit .env to GitHub
	•	Rotate Stripe keys every 90 days
	•	Keep registry.json read/write protected
	•	Only allow known domains in CORS
	•	Always use HTTPS
	•	Save logs (important for disputes)
	•	Salt must remain secret

⸻

🧠 Authored By

Adrian TRUFiT McKenzie
Founder — BizTech Wellness AI × iAscendAi
Builder of SoulMarkⓈ integrity, authored identity, and next-era humanitarian verification systems.

⸻

If you’re ready, I can now update:

✅ SYSTEM_OVERVIEW.md
or
✅ Navigation_Manifest_Jamaica-WeRise.yaml

