```md
# 🌍 System Overview — Jamaica We Rise × iAscendAi

## 🎯 Purpose
The **Jamaica We Rise** system provides a transparent, verifiable donation and identity registry powered by **SoulMarkⓈ** and **iAscendAi Authored Intelligence**.  
It allows donors, survivors, and organizations to connect through verified digital identities and track contributions in real time.

---

## 🧱 Core Components

| Component | Description |
|------------|--------------|
| **server.js** | Main Express backend that manages API routes, Stripe payments, and registry updates. |
| **config.js** | Defines system mode (`test` or `live`) and backend URLs for frontend pages. |
| **data/registry.json** | Stores verified users, SoulMarks, and donation data. |
| **logs/** | Contains automatically created server logs: `access.log`, `error.log`, and `events.log`. |
| **public/** | Frontend HTML files that power the user experience. |
| **docs/** | Developer and deployment documentation. |

---

## 📂 Folder Structure

```

jamaicawerise/
├── server.js
├── config.js
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

## 🔁 Data Flow Overview

1. **User submits donation form**  
   - From `index.html`, user enters name, email, and amount.  
   - Request sent → `POST /create-checkout-session`.

2. **Stripe Checkout session created**  
   - `server.js` uses Stripe API to create a secure session.  
   - User is redirected to Stripe’s hosted payment page.

3. **Payment confirmation + data sync**  
   - Upon successful payment, Stripe webhook updates the local registry.  
   - `registry.json` records donor data with timestamp and SoulMarkⓈ ID.

4. **Verification & Registry**  
   - `soulregistry.html` displays all registered/verified users.  
   - `verify-soulmark` endpoint checks validity of SoulMark signatures.

5. **Impact Dashboard**  
   - `impact.html` and `iascendai-dashboard.html` pull stats via `/donations/stats`.  
   - Real-time totals, donor count, and identity verification are displayed.

6. **Logging & Monitoring**  
   - Every request → `access.log`  
   - Any error → `error.log`  
   - Registry or system events → `events.log`

---

## 🧩 Core Technologies

| Layer | Technology |
|--------|-------------|
| **Backend** | Node.js + Express |
| **Payments** | Stripe API |
| **Data Storage** | Local JSON (`registry.json`) |
| **Frontend** | Static HTML + Fetch API |
| **Verification** | SoulMarkⓈ Identity Signatures |
| **Monitoring** | Express Morgan logger + custom event logging |

---

## 💡 Key Advantages

- **Transparent**: All activity logged and auditable.  
- **Lightweight**: No database dependency; JSON-based registry.  
- **Secure**: Stripe handles payments; backend validates origins.  
- **Verifiable**: Every donor and survivor entry linked to a SoulMarkⓈ.  
- **Extendable**: Easily integrates with future iAscendAi modules (e.g., FirstAidAI, SoulVaultⓈ).

---

## 🔮 Future Extensions

| Planned Feature | Description |
|------------------|-------------|
| **Live Registry Verification API** | Enable public SoulMarkⓈ lookups from external apps. |
| **Geo-Tagging Layer** | Register locations of verified survivors for resource delivery. |
| **Disaster Aid Tracking** | Integrate with FirstAidAI for real-time resource deployment. |
| **Cloud Sync** | Mirror registry.json to a secure cloud ledger or IPFS. |

---

## 🧠 Powered by
- **iAscendAi** — Authored Intelligence and adaptive verification framework  
- **SoulMarkⓈ** — Cryptographic authenticity proof  
- **Stripe** — Secure financial transaction layer  
- **Node.js + Express** — Backend framework enabling lightweight orchestration  
```

---


