# 💳 Stripe Checkout Session Edge Function (`create-checkout-session`)

<p align="center">
  <img src="../../../public/favicon.png" alt="RetroHub Logo" width="80" height="80" />
</p>

<p align="center">
  <b>PCI-Compliant International Payment Gateway & Currency Conversion Engine</b><br>
  <i>Engineered with Deno, Stripe Node/ESM SDK, and Supabase Edge Functions.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Deno%20Edge-black?style=for-the-badge&logo=deno&logoColor=white" alt="Deno Edge Runtime" />
  <img src="https://img.shields.io/badge/Payment-Stripe%20Embedded-635bff?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Currency-BDT%20%E2%86%92%20USD-green?style=for-the-badge&logo=cashapp&logoColor=white" alt="Currency Conversion" />
</p>

---

## 📖 Executive Summary

The **`create-checkout-session`** Edge Function securely initiates Stripe Checkout sessions for digital games, gift cards, subscriptions, and top-up orders on RetroHub. It enables international and card-carrying customers (Visa, Mastercard, American Express, Apple Pay, Google Pay) to complete orders seamlessly without exposing sensitive card information to the frontend.

---

## ⚡ Core Architecture & Workflow

1. **Order Validation**: Receives an array of `orderIds` from the client (`paymentApi.ts`). Queries the authoritative database rows in Supabase to fetch product details and prices, preventing client-side price tampering.
2. **Currency Conversion**: Dynamically converts store currency (BDT) to USD cents:
   $$\text{cents} = \max\left(\left\lfloor \frac{\text{amount}}{122} \times 100 \right\rceil, 50\right)$$
3. **Minimum Charge Guard**: Enforces Stripe's global transaction minimum equivalent to $0.50 USD (~৳65 BDT). Orders below this threshold return a descriptive error advising the buyer to use bKash or add items.
4. **Session Creation**: Configures an embedded Stripe Checkout session with `return_url`, line item breakdowns, and order ID metadata.
5. **Client Response**: Returns `{ clientSecret, sessionId }` to the frontend, which mounts the Stripe Embedded Checkout form.

---

## 🚀 Deployment Playbook

### 1. Deploy the Edge Function

```bash
npx supabase functions deploy create-checkout-session --no-verify-jwt
```

### 2. Configure Environment Secrets

```bash
npx supabase secrets set STRIPE_SECRET_KEY="sk_live_..."
```

---

## 📡 API Contract

### Request

- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <anon_or_user_jwt>`
- **Body**:
  ```json
  {
    "orderIds": ["f7b1c432-8e12-4c6e-8211-19db458ca201"],
    "returnUrl": "https://www.retrohub.tech/payment/success"
  }
  ```

### Response (Success)

```json
{
  "clientSecret": "seti_1..._secret_...",
  "sessionId": "cs_live_..."
}
```

### Response (Under Minimum Threshold)

```json
{
  "error": "Stripe card processing requires a minimum order amount of ৳65 (~$0.50 USD). Your current total is ৳50.00. Please pay via bKash or add more items to your cart."
}
```

---

## ⚙️ Environment Secrets

| Secret | Value Type | Description |
| :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | `string` | Stripe Secret API key (`sk_live_...` or `sk_test_...`). |
| `SUPABASE_URL` | `string` | Automatically injected by Supabase Edge runtime. |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Automatically injected by Supabase Edge runtime. |

---

## 📄 License

Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.  
© 2026 RETROHUB — Engineered by **Abir Hossain**.
