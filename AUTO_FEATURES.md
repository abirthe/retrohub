# Auto Features Documentation

## 🤖 Automatic Features Overview

Your RETROHUB platform now includes automatic features that handle inventory management and order fulfillment without manual intervention.

## ✅ Implemented Auto Features

### 1. **Automatic Stock Updates** 📊

**What it does:**
- Automatically updates `products.in_stock` whenever inventory keys are added, removed, or sold
- Keeps stock counts accurate in real-time

**How it works:**
- Trigger: `trigger_update_stock_on_inventory_change`
- Function: `update_product_stock()`
- Runs automatically when:
  - New keys are added to `inventory_keys`
  - Keys are marked as sold
  - Keys are deleted

**Example:**
```sql
-- When you add keys, stock updates automatically
INSERT INTO inventory_keys (product_id, pin_code, status)
VALUES ('product-id', 'KEY123', 'available');
-- Product stock count increases automatically!
```

### 2. **Automatic Order Fulfillment** 🚀

**What it does:**
- Automatically delivers codes when orders are validated
- Only works for `instant_code` delivery type products
- Marks orders as completed and assigns keys

**How it works:**
- Trigger: `trigger_auto_fulfill_order`
- Function: `auto_fulfill_order()`
- Runs when order status changes to `validated`

**Process:**
1. Order status changes to `validated`
2. System finds first available key for that product
3. Marks key as `sold` and links to order
4. Updates order with code in `final_output`
5. Sets order status to `completed`
6. Logs the fulfillment in audit_logs

**If no keys available:**
- Order status set to `failed`
- Error message stored in `final_output`
- Logged in audit_logs

## 🔧 Helper Functions

### Sync All Stock

Manually sync all product stock counts:

```sql
SELECT public.sync_all_stock();
```

Use this if stock counts seem incorrect.

### Retry Failed Orders

Manually retry a failed order:

```sql
SELECT public.retry_failed_order('order-uuid-here');
```

Returns `true` if successful, `false` if failed.

## 📋 Workflow Examples

### Scenario 1: Customer Places Order

1. **Customer adds product to cart and checks out**
   - Order created with status `pending`

2. **Admin validates payment** (or auto-validate if enabled)
   ```sql
   UPDATE orders SET status = 'validated' WHERE id = 'order-id';
   ```

3. **System automatically:**
   - Finds available key
   - Assigns key to order
   - Updates order status to `completed`
   - Customer sees code in their orders page

### Scenario 2: Adding Inventory

1. **You add new keys:**
   ```sql
   INSERT INTO inventory_keys (product_id, pin_code, status)
   VALUES 
     ('product-id', 'KEY001', 'available'),
     ('product-id', 'KEY002', 'available');
   ```

2. **System automatically:**
   - Updates product `in_stock` count
   - Product shows correct stock on website

### Scenario 3: Stock Runs Out

1. **Last key is sold**
   - Order automatically fulfilled
   - Product stock becomes 0
   - Website shows "Out of Stock"

2. **New order comes in:**
   - Order validated
   - System finds no keys
   - Order marked as `failed`
   - Admin can retry when keys are added

## 🎯 Best Practices

### 1. Order Processing

**Recommended Flow:**
```
Order Created (pending) 
  → Validate Payment (validated) 
  → Auto-Fulfill (completed)
```

**For instant_code products:**
- Just validate the order, fulfillment happens automatically
- Check failed orders if keys run out

**For other delivery types:**
- Process manually or integrate with your API/automation system

### 2. Inventory Management

- **Add keys in bulk** - Stock updates automatically
- **Monitor failed orders** - Indicates stock issues
- **Use sync_all_stock()** - If counts seem wrong

### 3. Monitoring

Check audit logs for auto-fulfillment activity:

```sql
SELECT * FROM audit_logs 
WHERE event_type IN ('order_auto_fulfilled', 'order_auto_fulfill_failed')
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Orders Not Auto-Fulfilling

**Check:**
1. Order status is `validated` (not `pending`)
2. Product `delivery_type` is `instant_code`
3. Keys exist in inventory with `status = 'available'`

**Fix:**
```sql
-- Check order status
SELECT status, product_id FROM orders WHERE id = 'order-id';

-- Check product type
SELECT delivery_type FROM products WHERE id = 'product-id';

-- Check available keys
SELECT COUNT(*) FROM inventory_keys 
WHERE product_id = 'product-id' AND status = 'available';
```

### Stock Count Incorrect

**Fix:**
```sql
-- Manually sync all stock
SELECT public.sync_all_stock();

-- Or update specific product
UPDATE products SET in_stock = (
  SELECT COUNT(*) FROM inventory_keys 
  WHERE product_id = products.id AND status = 'available'
) WHERE id = 'product-id';
```

### Failed Orders

**Retry manually:**
```sql
SELECT public.retry_failed_order('order-id');
```

**Or manually fulfill:**
```sql
-- Get available key
SELECT id, pin_code FROM inventory_keys 
WHERE product_id = 'product-id' AND status = 'available' LIMIT 1;

-- Update order
UPDATE orders 
SET final_output = 'the-key-code',
    status = 'completed'
WHERE id = 'order-id';

-- Mark key as sold
UPDATE inventory_keys 
SET status = 'sold', order_id = 'order-id', sold_at = NOW()
WHERE id = 'key-id';
```

## 📊 Monitoring Auto Features

### View Auto-Fulfilled Orders

```sql
SELECT o.*, p.title
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.status = 'completed'
  AND EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE event_type = 'order_auto_fulfilled' 
      AND record_id = o.id
  )
ORDER BY o.created_at DESC;
```

### View Failed Auto-Fulfillments

```sql
SELECT o.*, p.title, o.final_output as error_message
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.status = 'failed'
  AND EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE event_type = 'order_auto_fulfill_failed' 
      AND record_id = o.id
  )
ORDER BY o.created_at DESC;
```

### Check Stock Update Activity

```sql
SELECT 
  p.title,
  p.in_stock,
  COUNT(ik.id) FILTER (WHERE ik.status = 'available') as actual_available
FROM products p
LEFT JOIN inventory_keys ik ON p.id = ik.product_id
GROUP BY p.id, p.title, p.in_stock
HAVING p.in_stock != COUNT(ik.id) FILTER (WHERE ik.status = 'available');
```

## 🚀 Advanced: Enable Auto-Validation

If you want orders to skip the `pending` state and auto-validate on creation, uncomment this in the migration:

```sql
-- Uncomment in migration file to enable:
CREATE TRIGGER trigger_auto_validate_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_order();
```

**Warning:** This means orders will auto-fulfill immediately on creation. Only enable if:
- Payment is processed before order creation
- You trust all order creation sources
- You want fully automated fulfillment

## 📝 Summary

✅ **Automatic Stock Updates** - Real-time inventory sync  
✅ **Automatic Order Fulfillment** - Instant code delivery  
✅ **Failed Order Handling** - Automatic failure detection  
✅ **Audit Logging** - Complete activity tracking  

Your platform now handles most operations automatically! Just:
1. Add inventory keys
2. Validate orders
3. System does the rest! 🎉

---

**Dev by ABIR HOSSAIN**

