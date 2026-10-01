# 🛡️ RetroHub Staff & Admin Bot (Notifyretro)

<p align="center">
  <b>Internal Merchant Ops & Order Dispatch Engine</b><br>
  <i>Engineered with Deno and Supabase Edge Functions.</i>
</p>

---

## 📖 Executive Summary

The **Admin Webhook (`telegram-webhook`)** is the internal command center for the RetroHub merchant desk. Unlike the customer-facing bot, this bot is strictly for staff operations. It handles real-time notifications for new orders, stock alerts, and payment proofs. It also accepts text commands (`/deliver`, `/cancel`, `/order`) to rapidly interact with the Supabase database without needing to open the web admin dashboard.

---

## 🚀 Deployment Playbook

### 1. Deploy the Edge Function

Ship the finalized code to the Supabase Edge infrastructure:

```bash
npx supabase functions deploy telegram-webhook --no-verify-jwt
```

### 2. Register Webhook Dispatcher

Bind the webhook endpoint to Telegram with the cryptographic secret:

```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot<YOUR_ADMIN_BOT_TOKEN>/setWebhook" -Method Post -Body @{
    url = "https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/telegram-webhook"
    secret_token = "<YOUR_TELEGRAM_WEBHOOK_SECRET>"
}
```

---

## ⚡ Core Features & Capabilities

### 1. Automated Merchant Alerts
- **New Orders:** Instantly alerts the staff group when a new order is placed, including product details, total amount, and inline actions (Inspect, Cancel).
- **Stock Warnings:** Monitors inventory levels and sends a `⚠️ LOW STOCK ALERT` if items are running out.
- **Payment Notifications:** Alerts staff when payment verifications are needed.

### 2. Rapid Ops Commands (Bot Interface)
The bot acts as a fully-featured CRM terminal directly within Telegram:
- `/order <ID>` - Inspects a specific order and displays its full details.
- `/deliver <ID> <CODE>` - Instantly fulfills an order by securely saving the digital key and notifying the customer.
- `/cancel <ID> <REASON>` - Cancels an order and refunds if applicable, appending the cancellation reason.
- `/reply <CHAT_ID> <MSG>` - Relays messages back to the customer via the `customer-bot`, creating a seamless bridge between staff and customers.

### 3. Application Webhook Bridge
The edge function handles direct `POST` requests from the RetroHub frontend or backend:
- Validates requests via Supabase Auth/API keys or internal secrets (`X-Internal-Secret`).
- Broadcasts UI-triggered actions (like `action: 'order_created'`) securely to Telegram.

---

## ⚙️ Environment Secrets Vault

Ensure these are populated in your Supabase Secrets manager:

| Secret | Value Type | Description |
| :--- | :--- | :--- |
| `BOT_TOKEN` | `string` | Primary token for the Admin bot (e.g. `@Notifyretro_bot`). |
| `ADMIN_CHAT_ID` | `string` | Telegram Admin Chat / Group ID to route operations messages. |
| `TELEGRAM_WEBHOOK_SECRET` | `string` | Cryptographic secret verified against `X-Telegram-Bot-Api-Secret-Token` header. |
| `CUSTOMER_BOT_TOKEN` | `string` | Needed to send messages back to customers via the `/reply` command. |

_Developed for RetroHub E-Commerce. Powered by Deno & Supabase._
