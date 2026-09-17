# Email Delivery Setup Guide

## 📧 How Products Are Delivered to Customers

Currently, your RETROHUB platform has **two delivery methods**:

### 1. **Web Dashboard Delivery** (Currently Active)
- Customers view their product codes on the `/orders` page
- Codes are displayed in the "Details" column when order status is "Completed"
- This is the default method and works immediately

### 2. **Email Delivery** (Needs Setup)
- Automated email notifications when orders are completed
- Product codes sent directly to customer's email
- Professional HTML email template

---

## 🚀 Setting Up Email Delivery

### Option 1: Using Resend (Recommended - Free Tier Available)

**Resend** offers 3,000 emails/month free, perfect for starting out.

#### Step 1: Create Resend Account
1. Go to [resend.com](https://resend.com) and sign up
2. Verify your account
3. Go to **API Keys** section
4. Create a new API key and copy it

#### Step 2: Add Environment Variables
Add these to your Supabase project:

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Edge Functions**
2. Add these secrets:
   ```
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=noreply@yourdomain.com
   SITE_URL=https://your-site.com
   ```

**Note:** For `FROM_EMAIL`, you need to:
- Verify your domain in Resend, OR
- Use Resend's test domain: `onboarding@resend.dev` (for testing only)

#### Step 3: Deploy Edge Function
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
npx supabase login

# Deploy the email function
npx supabase functions deploy send-order-email
```

#### Step 4: Update Database Function
The migration `20260208095000_email_notifications.sql` has been created. Push it:

```bash
npx supabase db push
```

#### Step 5: Test Email Delivery
1. Complete an order in your admin dashboard
2. Check the customer's email inbox
3. Check Supabase logs: **Edge Functions** → **send-order-email** → **Logs**

---

### Option 2: Using SendGrid

If you prefer SendGrid:

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Update the Edge Function to use SendGrid API instead of Resend
4. Set environment variable: `SENDGRID_API_KEY`

---

### Option 3: Using Supabase Built-in Email (Limited)

Supabase has limited email capabilities. For production, use Resend or SendGrid.

---

## 🔧 Manual Email Sending

If you want to manually send emails for specific orders:

```sql
-- Send email for a specific order
SELECT public.send_order_completion_email('order-uuid-here');
```

---

## 📋 Email Template Customization

The email template is in:
```
supabase/functions/send-order-email/index.ts
```

You can customize:
- Email design and colors
- Company branding
- Additional information
- Links and call-to-actions

---

## ✅ Current Status

**What Works Now:**
- ✅ Customers can view codes on `/orders` page
- ✅ Database triggers are set up for email notifications
- ✅ Email function is ready to deploy

**What Needs Setup:**
- ⚠️ Email service API key (Resend/SendGrid)
- ⚠️ Edge Function deployment
- ⚠️ Domain verification (for production emails)

---

## 🧪 Testing Without Email Service

For testing, you can:

1. **Check Audit Logs**: Emails are logged in `audit_logs` table
   ```sql
   SELECT * FROM audit_logs 
   WHERE event_type = 'email_sent' 
   ORDER BY created_at DESC;
   ```

2. **View Order Details**: Check `final_output` field in orders table
   ```sql
   SELECT id, final_output, status 
   FROM orders 
   WHERE status = 'completed';
   ```

---

## 🚨 Troubleshooting

### Emails Not Sending?

1. **Check Edge Function Logs**
   - Supabase Dashboard → Edge Functions → Logs
   - Look for error messages

2. **Verify API Key**
   - Make sure `RESEND_API_KEY` is set correctly
   - Check if API key has proper permissions

3. **Check Email Service Status**
   - Resend: [status.resend.com](https://status.resend.com)
   - SendGrid: [status.sendgrid.com](https://status.sendgrid.com)

4. **Verify FROM_EMAIL**
   - Must be a verified domain in Resend
   - Or use test domain for development

### Edge Function Not Deploying?

```bash
# Check Supabase CLI version
npx supabase --version

# Update if needed
npm install -g supabase@latest

# Try deploying with debug
npx supabase functions deploy send-order-email --debug
```

---

## 📊 Email Delivery Flow

```
1. Admin fulfills order
   ↓
2. Order status → 'completed'
   ↓
3. Database trigger fires
   ↓
4. Edge Function called
   ↓
5. Email sent to customer
   ↓
6. Customer receives code in email
```

---

## 💡 Quick Start (5 Minutes)

1. **Sign up for Resend** → Get API key
2. **Add secrets to Supabase** → Settings → Edge Functions
3. **Deploy function**: `npx supabase functions deploy send-order-email`
4. **Push migration**: `npx supabase db push`
5. **Test**: Complete an order and check email!

---

## 📞 Support

If you need help:
- Check Supabase logs
- Review Edge Function code
- Verify environment variables
- Test with a simple order first

**Remember**: Email delivery requires an external service (Resend/SendGrid). The web dashboard delivery works immediately without any setup!

