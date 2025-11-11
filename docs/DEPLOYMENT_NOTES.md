```md
# ⚙️ Deployment Notes — Jamaica We Rise × iAscendAi

## 🧭 Overview
This document explains how to set up, run, and maintain the **Jamaica We Rise** donation system — from local development to live deployment.  
It includes environment setup, backend configuration, Stripe integration, and troubleshooting notes.

---

## 🧰 Requirements

| Tool | Version | Notes |
|------|----------|-------|
| **Node.js** | ≥ 18.x | Required for backend server |
| **npm** | ≥ 9.x | Used for installing dependencies |
| **Stripe Account** | Live + Test Keys | Needed for payments |
| **Git** | optional | For version control and deployment |

---

## 🗂️ Folder Preparation

```

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
│   ├── iascendai-register.html
│   ├── iascendai-verify.html
│   ├── iascendai-dashboard.html
│   ├── soulregistry.html
│   └── impact.html
└── docs/
├── API_REFERENCE.md
├── SYSTEM_OVERVIEW.md
└── DEPLOYMENT_NOTES.md

```

---

## 🔐 Environment Configuration (`.env`)

Create a `.env` file at the project root and include:

```

# --- TEST ENVIRONMENT ---

MODE=test
STRIPE_SECRET_KEY=<redacted>
STRIPE_PUBLISHABLE_KEY=<redacted>

# --- LIVE ENVIRONMENT ---

STRIPE_SECRET_KEY=<redacted>
STRIPE_PUBLISHABLE_KEY=<redacted>

# --- LOCAL SETTINGS ---

FRONTEND_URL=[http://127.0.0.1:3000](http://127.0.0.1:3000)
PORT=10000

```

Switch between **test** and **live** by changing:
```

MODE=test  →  MODE=live

````

---

## 🚀 Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
````

2. **Run backend**

   ```bash
   node server.js
   ```

   or for development:

   ```bash
   nodemon server.js
   ```

3. **Access frontend**
   Open:

   ```
   http://127.0.0.1:3000
   ```

4. **Test donation**
   Use Stripe’s test card:

   ```
   4242 4242 4242 4242
   Exp: Any future date
   CVC: 123
   ZIP: Any
   ```

---

## 🌐 Deployment (Live)

### Option 1 — Render / Railway / Vercel / Netlify (Recommended)

* Upload your backend code.
* Add `.env` values using the provider’s environment settings.
* Set **MODE=live**.
* Deploy `public/` folder for static pages.

### Option 2 — Manual Server (e.g., VPS / DigitalOcean)

1. Clone repository
2. Install Node dependencies
3. Configure `.env`
4. Run:

   ```bash
   pm2 start server.js --name jamaicawerise
   ```
5. Ensure HTTPS + firewall open on port 10000

---

## 📜 Logs & Monitoring

| Log File          | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `logs/access.log` | Tracks every HTTP request (auto via Morgan) |
| `logs/error.log`  | Captures server + Stripe errors             |
| `logs/events.log` | Records system actions and registry updates |

To view logs in real time:

```bash
tail -f logs/access.log
```

---

## ⚠️ Troubleshooting

| Issue                                    | Likely Cause                                      | Fix                                                |
| ---------------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| **Stripe page not opening**              | Incorrect key or backend not running              | Check `.env` and confirm `PORT=10000`              |
| **Cannot verify SoulMark**               | Registry endpoint inactive                        | Restart backend and check `/verify-soulmark` route |
| **CORS error**                           | Mismatch between `FRONTEND_URL` and actual origin | Update `.env` FRONTEND_URL to match live domain    |
| **Donations not appearing in dashboard** | Backend not updating `registry.json`              | Ensure webhook or local write permissions enabled  |

---

## 🧩 Maintenance Notes

* Clear logs periodically to prevent large files:

  ```bash
  rm logs/*.log && touch logs/access.log logs/error.log logs/events.log
  ```

* Backup `data/registry.json` regularly.

* When deploying updates, test in **MODE=test** first.

---

## ✅ Verification Checklist

| Step                             | Status |
| -------------------------------- | ------ |
| `.env` configured                | ☐      |
| Backend running without errors   | ☐      |
| Stripe test payment successful   | ☐      |
| Dashboard showing updated totals | ☐      |
| Registry entries verified        | ☐      |

---

## 🔒 Security Recommendations

* Never commit `.env` to GitHub.
* Rotate Stripe keys quarterly.
* Restrict API access by domain (CORS).
* Monitor logs for repeated failed requests.

---

## 🧠 Authored By

**Adrian TRUFiT McKenzie**
Founder, BizTech Wellness AI × iAscendAi
Designed to demonstrate **authentic, verifiable humanitarian infrastructure** powered by **SoulMarkⓈ Integrity**.

```

---

