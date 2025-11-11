# 📘 API Reference — Jamaica We Rise × iAscendAi

## 🔹 Base URL
http://localhost:10000

yaml
Copy code

---

## 💳 Stripe Donation Flow

### `POST /create-checkout-session`
Creates a new Stripe checkout session.

**Body Parameters**
| Field | Type | Required | Description |
|-------|------|-----------|--------------|
| name | string | ✅ | Donor’s full name |
| email | string | ✅ | Email address |
| amount | number | ✅ | Donation amount in USD |

**Response Example**
```json
{ "url": "https://checkout.stripe.com/pay/cs_test_..." }