# Stripe Integration Next Steps

The initial minimal server-side and client-side setup for Stripe Checkout is complete using Embedded Form.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | payment | Set to "payment" for one-time charges or "subscription" for recurring billing. |
| line_items[].price | price_... | Your actual Stripe Price ID from the Dashboard (https://dashboard.stripe.com/prices) or API. |

*Note: For SDK versions below 21.0.0, the `ui_mode` is set to "custom" as required for the embedded form preview (using the `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1` API version).*

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | custom (adapted for Deno Stripe SDK version requirement) |
| billing_address_collection | auto |
| phone_number_collection.enabled | false |
| automatic_tax.enabled | false |
| submit_type | auto |
| tax_id_collection.enabled | true |
| tax_id_collection.required | if_supported |
| name_collection.individual.enabled | true |
| saved_payment_method_options.payment_method_save | enabled |
| integration_identifier | custom_embedded_web_0002 |

## Setup and Next Steps

1. **Environment Variables**:
   - Add `VITE_STRIPE_PUBLISHABLE_KEY` (must be prefixed with `VITE_` for browser accessibility) to your client-side `.env` or Vite environment file.
   - Add `STRIPE_SECRET_KEY` to your Supabase Edge Function environment via the Supabase Dashboard or CLI.

2. **Testing**:
   - Use test credit card numbers from Stripe (e.g., `4242 4242 4242 4242`) while in test mode.
   - Update your `line_items` with a valid test mode price ID from your Stripe dashboard.

3. **Routing & Component Usage**:
   - The `<StripeCheckout />` component has been created at `src/components/StripeCheckout.tsx`. You will need to render this component on the desired route (e.g. creating a new Checkout page).

4. **Webhook Setup (Optional but recommended)**:
   - Create a webhook endpoint in Supabase to listen to `checkout.session.completed` events if you need to fulfill orders automatically.

## Resources
- [Stripe Documentation](https://docs.stripe.com)
- [Stripe Support](https://support.stripe.com)
- [Stripe MCP Guide](https://docs.stripe.com/mcp)
