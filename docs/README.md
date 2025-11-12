# 🌍 Jamaica We Rise × iAscendAi  
### Authored-Intelligence Frontend & Verification Ecosystem

This repository hosts the **public frontend** and **static route layer** for the *Jamaica We Rise* initiative — a verified identity and donation infrastructure built on the iAscendAi framework.

---

## 🧭 Navigation & Flow
All routes, backend endpoints, and live connections are documented in:  
[`/docs/Navigation_Manifest_JamaicaWeRise.yaml`](./docs/Navigation_Manifest_JamaicaWeRise.yaml)

| Stage | File | Description |
|-------|------|--------------|
| 💚 1. Donate | [`donate.html`](./public/donate.html) | Launch verified Stripe donation session |
| 🌟 2. Verify | [`success.html`](./public/success.html) | Confirm payment + generate SoulMarkⓈ |
| 🧠 3. Register | [`iascendai-register.html`](./public/iascendai-register.html) | Create identity in SoulRegistryⓈ |
| 🏠 4. Dashboard | [`iascendai-dashboard.html`](./public/iascendai-dashboard.html) | View verified profile + activity |
| 📈 5. Tracker | [`tracker.html`](./public/tracker.html) | Display live donation metrics |
| 🔗 6. Registry | [`soulregistry.html`](./public/soulregistry.html) | Browse verified identities |
| 🔍 7. Verify | [`verify.html`](./public/verify.html) | Search and confirm SoulMarksⓈ |
| 🌍 8. Impact | [`impact-dashboard.html`](./public/impact-dashboard.html) | Aggregate transparency dashboard |

---

## ⚙️ Configuration
Backend URL and environment mode are managed in:
```js
// config.js
export const CONFIG = {
  MODE: "production",
  BACKEND_URL: "https://jamaica-we-rise.onrender.com"
};
````

---

## 🚀 Deployment

| Layer    | Platform                    | URL                                                                          |
| -------- | --------------------------- | ---------------------------------------------------------------------------- |
| Frontend | **Vercel**                  | [https://jamaica-we-rise.vercel.app](https://jamaica-we-rise.vercel.app)     |
| Backend  | **Render (Node + Express)** | [https://jamaica-we-rise.onrender.com](https://jamaica-we-rise.onrender.com) |

---

## 🧩 Directory Layout

```
/public
  donate.html
  success.html
  iascendai-register.html
  iascendai-dashboard.html
  tracker.html
  soulregistry.html
  verify.html
  impact-dashboard.html
  config.js

/docs
  Navigation_Manifest_JamaicaWeRise.yaml
  README.md  ← this file

/logs
  access.log
  events.log
  error.log
```

---

## ✅ Testing Flow

1. Start backend → confirm log shows `"mode":"production"`.
2. Open `/donate.html` → complete Stripe checkout.
3. Verify redirect to `/success.html?session_id=…`.
4. Check SoulMarkⓈ appears in `/registry`.
5. Visit `/verify.html` to confirm identity authenticity.
6. Review totals on `/impact-dashboard.html`.

---

📜 *Maintained by Adrian TRUFiT McKenzie × BizTech Wellness AI • Authored Systems Collective*

```

---

🪄 **Save Location:**  
```

C:\SoulVault\JamaicaWeRise\docs\README.md

```


