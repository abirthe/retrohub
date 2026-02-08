# Sales Guide - How to Use RETROHUB for Your Business

Complete guide on how to use the RETROHUB platform to manage and complete sales of game keys, gift cards, and top-ups.

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [Adding Products](#adding-products)
3. [Managing Inventory](#managing-inventory)
4. [Processing Orders](#processing-orders)
5. [Fulfilling Orders](#fulfilling-orders)
6. [Customer Management](#customer-management)
7. [Admin Dashboard](#admin-dashboard)
8. [Best Practices](#best-practices)

---

## 🚀 Initial Setup

### 1. Configure Supabase Database

1. **Create a Supabase Project** (if not already done)
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Migrations**
   - The migrations are in `supabase/migrations/`
   - Run them through Supabase SQL Editor or CLI
   - This creates all necessary tables and policies

3. **Set Up Admin User**
   - Sign up through the website (`/auth`)
   - In Supabase dashboard, go to Authentication → Users
   - Find your user ID
   - In SQL Editor, run:
     ```sql
     INSERT INTO public.user_roles (user_id, role)
     VALUES ('your-user-id-here', 'admin');
     ```

4. **Configure Environment Variables**
   - Create `.env` file in project root:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
     ```

---

## 📦 Adding Products

### Method 1: Using Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **Table Editor** → **products**

2. **Add a New Product**
   - Click **Insert** → **Insert row**
   - Fill in the required fields:

   | Field | Description | Example |
   |-------|-------------|---------|
   | `title` | Product name | "Steam $50 Gift Card" |
   | `category` | Product category | `giftcard`, `topup`, or `subscription` |
   | `region` | Region tag | `GLOBAL`, `US`, `EU`, `ASIA`, `LATAM` |
   | `delivery_type` | How it's delivered | `instant_code`, `api_h2h`, `automation` |
   | `cost_price` | Your cost (BDT) | `4200.00` |
   | `sale_price` | Selling price (BDT) | `4500.00` |
   | `platform` | Platform name | "Steam", "PlayStation", "Xbox" |
   | `description` | Product description | "Digital gift card for Steam platform" |
   | `in_stock` | Available quantity | `100` |
   | `is_active` | Show on website | `true` |

3. **Save the Product**
   - Click **Save** or press Enter
   - Product will appear on your website immediately

### Method 2: Using SQL (Bulk Import)

```sql
INSERT INTO public.products (
  title, category, region, delivery_type, 
  cost_price, sale_price, platform, description, in_stock, is_active
) VALUES
  ('Steam $50 Gift Card', 'giftcard', 'GLOBAL', 'instant_code', 4200.00, 4500.00, 'Steam', 'Digital gift card', 100, true),
  ('PlayStation Plus 1 Month', 'subscription', 'GLOBAL', 'api_h2h', 800.00, 950.00, 'PlayStation', 'PS Plus subscription', 50, true),
  ('Robux 1000', 'topup', 'GLOBAL', 'automation', 850.00, 1000.00, 'Roblox', 'Robux currency', 200, true);
```

### Product Categories

- **`giftcard`**: Digital gift cards (Steam, PlayStation, Xbox, etc.)
- **`topup`**: In-game currency top-ups (Robux, V-Bucks, etc.)
- **`subscription`**: Service subscriptions (PS Plus, Xbox Game Pass, etc.)

### Delivery Types

- **`instant_code`**: Pre-loaded codes, delivered instantly
- **`api_h2h`**: Head-to-head API integration, automated delivery
- **`automation`**: Fully automated fulfillment system

---

## 📊 Managing Inventory

### Adding Digital Keys (For Instant Code Products)

1. **Go to Supabase Dashboard**
   - Navigate to **Table Editor** → **inventory_keys**

2. **Add Keys**
   - Click **Insert** → **Insert row**
   - Fill in:
     - `product_id`: Select the product
     - `pin_code`: The actual code/key
     - `serial_number`: Optional serial number
     - `status`: Set to `available`

3. **Bulk Import Keys (SQL)**

```sql
-- Get product ID first
SELECT id FROM products WHERE title = 'Steam $50 Gift Card';

-- Insert multiple keys
INSERT INTO public.inventory_keys (product_id, pin_code, status)
VALUES
  ('product-uuid-here', 'KEY1-XXXX-XXXX-XXXX', 'available'),
  ('product-uuid-here', 'KEY2-XXXX-XXXX-XXXX', 'available'),
  ('product-uuid-here', 'KEY3-XXXX-XXXX-XXXX', 'available');
```

### Updating Stock Levels

**Method 1: Via Product Table**
```sql
UPDATE public.products 
SET in_stock = 150 
WHERE title = 'Steam $50 Gift Card';
```

**Method 2: Count Available Keys**
```sql
-- Auto-update stock based on available keys
UPDATE public.products p
SET in_stock = (
  SELECT COUNT(*) 
  FROM inventory_keys ik 
  WHERE ik.product_id = p.id AND ik.status = 'available'
);
```

---

## 🛒 Processing Orders

### Viewing Orders

1. **Access Admin Dashboard**
   - Log in as admin
   - Go to `/admin` route
   - View the **Recent Orders** table

2. **Order Statuses**
   - **`pending`**: New order, needs processing
   - **`validated`**: Payment confirmed, ready to fulfill
   - **`processing`**: Currently being fulfilled
   - **`completed`**: Successfully delivered
   - **`failed`**: Fulfillment failed, needs retry

### Processing a Pending Order

1. **Check Order Details**
   - Click on order in admin dashboard
   - Note the product and customer information
   - Check `customer_input` for any special requirements

2. **Validate Payment** (if needed)
   - Verify payment was received
   - Update order status to `validated`

3. **Fulfill the Order**

   **For Instant Code Products:**
   ```sql
   -- Get an available key
   SELECT id, pin_code 
   FROM inventory_keys 
   WHERE product_id = 'product-id' AND status = 'available' 
   LIMIT 1;
   
   -- Mark key as sold and link to order
   UPDATE inventory_keys 
   SET status = 'sold', 
       order_id = 'order-id',
       sold_at = NOW()
   WHERE id = 'key-id';
   
   -- Update order with the code
   UPDATE orders 
   SET final_output = 'the-actual-code-here',
       status = 'completed',
       updated_at = NOW()
   WHERE id = 'order-id';
   ```

   **For API H2H Products:**
   - Call your API integration
   - Update order with API response
   - Set status to `completed`

   **For Automated Products:**
   - System should handle automatically
   - Monitor for completion
   - Manually update if needed

4. **Update Order Status**
   ```sql
   UPDATE orders 
   SET status = 'completed',
       final_output = 'delivered-code-or-info',
       updated_at = NOW()
   WHERE id = 'order-id';
   ```

---

## ✅ Fulfilling Orders

### Manual Fulfillment Process

1. **Access Order**
   - Go to Admin Dashboard → Recent Orders
   - Find pending/validated orders

2. **Retrieve Product Key**
   - For instant_code: Get from `inventory_keys` table
   - For api_h2h: Call your API
   - For automation: Check automation logs

3. **Update Order**
   ```sql
   UPDATE orders 
   SET 
     final_output = 'ACTUAL-CODE-HERE',
     status = 'completed',
     updated_at = NOW()
   WHERE id = 'order-uuid';
   ```

4. **Customer Receives Code**
   - Customer can view code in `/orders` page
   - Code appears in `final_output` field

### Automated Fulfillment (Recommended)

Create a database function or external service to:

1. **Monitor New Orders**
   ```sql
   -- Find orders ready for fulfillment
   SELECT * FROM orders 
   WHERE status = 'validated' 
   ORDER BY created_at ASC;
   ```

2. **Auto-Fulfill Logic**
   - Get available key from inventory
   - Mark key as sold
   - Update order with code
   - Set status to completed

3. **Error Handling**
   - If no keys available: Set status to `failed`
   - Log errors for manual review
   - Notify admin of failures

---

## 👥 Customer Management

### Viewing Customer Orders

1. **In Admin Dashboard**
   - Orders table shows all orders
   - Filter by user_id to see customer history

2. **Customer Information**
   ```sql
   -- Get customer details
   SELECT u.email, p.full_name, COUNT(o.id) as total_orders
   FROM auth.users u
   JOIN profiles p ON u.id = p.id
   LEFT JOIN orders o ON u.id = o.user_id
   GROUP BY u.id, u.email, p.full_name;
   ```

### Handling Customer Issues

1. **Refund Process**
   ```sql
   -- Mark order as failed/refunded
   UPDATE orders 
   SET status = 'failed',
       final_output = 'Refunded - Reason: [reason]'
   WHERE id = 'order-id';
   ```

2. **Resend Code**
   - If customer lost code, check order `final_output`
   - Resend via email or update order

---

## 📈 Admin Dashboard Features

### Revenue Tracking

- **Revenue Today**: Sum of all completed orders
- **Orders Today**: Count of orders created today
- **Avg Margin**: Average profit margin across products
- **Failed Orders**: Count of failed orders needing attention

### Inventory Overview

- View all products with:
  - Current stock levels
  - Cost vs. Sale price
  - Profit margin percentage
  - Delivery type

### Order Management

- View all orders with:
  - Order ID
  - Product name
  - Status
  - Total amount
  - Customer information
  - Delivery status

---

## 💡 Best Practices

### 1. Inventory Management

- **Keep Stock Updated**: Regularly sync `inventory_keys` count with `products.in_stock`
- **Monitor Low Stock**: Set alerts for products with low inventory
- **Bulk Import**: Use SQL for adding many keys at once

### 2. Order Processing

- **Process Orders Quickly**: Aim for < 5 minutes for instant_code products
- **Validate Before Fulfilling**: Ensure payment is confirmed
- **Track Failures**: Monitor failed orders and retry or refund

### 3. Pricing Strategy

- **Set Competitive Prices**: Research market rates
- **Maintain Margins**: Ensure `sale_price > cost_price`
- **Update Regularly**: Adjust prices based on market conditions

### 4. Customer Service

- **Quick Response**: Process orders promptly
- **Clear Communication**: Ensure codes are delivered correctly
- **Handle Issues**: Quickly resolve failed orders or refunds

### 5. Security

- **Protect Keys**: Never expose keys in logs or public areas
- **Access Control**: Only admins should access inventory_keys
- **Audit Trail**: Use audit_logs table to track changes

---

## 🔧 Useful SQL Queries

### Get Today's Revenue
```sql
SELECT SUM(total) as revenue_today
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
AND status = 'completed';
```

### Get Low Stock Products
```sql
SELECT title, in_stock, platform
FROM products
WHERE in_stock < 10 AND is_active = true
ORDER BY in_stock ASC;
```

### Get Pending Orders
```sql
SELECT o.id, o.created_at, p.title, o.total, u.email
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN auth.users u ON o.user_id = u.id
WHERE o.status = 'pending'
ORDER BY o.created_at ASC;
```

### Get Available Keys for Product
```sql
SELECT COUNT(*) as available_keys
FROM inventory_keys
WHERE product_id = 'product-uuid'
AND status = 'available';
```

### Update Product Stock from Keys
```sql
UPDATE products p
SET in_stock = (
  SELECT COUNT(*) 
  FROM inventory_keys ik 
  WHERE ik.product_id = p.id 
  AND ik.status = 'available'
)
WHERE p.id = 'product-uuid';
```

---

## 🚨 Troubleshooting

### Orders Not Appearing
- Check if user has admin role
- Verify RLS policies are correct
- Check order status filters

### Keys Not Available
- Verify keys exist in `inventory_keys`
- Check key status is `available`
- Ensure product_id matches

### Prices Not Updating
- Clear browser cache
- Check if product `is_active = true`
- Verify database updates were saved

### Customers Can't See Orders
- Check user authentication
- Verify order `user_id` matches customer
- Check RLS policies for orders table

---

## 📞 Support

For technical issues:
- Check `TROUBLESHOOTING.md` for common problems
- Review Supabase logs for errors
- Check browser console for frontend issues

---

**Dev by ABIR HOSSAIN**

Last updated: 2024

