# Admin Order Management System

## Overview

The Admin Order Management System provides full backend-connected control over order fulfillment, cancellation, refunds, and holds. All operations are verified against the database to ensure data integrity.

## Features

### 1. **Manual Order Fulfillment**
- **Function**: `fulfill_order_manual(order_id)`
- **Backend Verification**: Checks database for available inventory keys before fulfillment
- **Behavior**:
  - Only works if keys exist in `inventory_keys` table with `status = 'available'`
  - Automatically assigns a key to the order
  - Marks key as `sold` and links it to the order
  - Updates order status to `completed`
  - Returns error if no keys available
- **UI**: "Fulfill Now" button in order actions dropdown
- **Access**: Admin only

### 2. **Order Validation**
- **Function**: `validate_order(order_id)`
- **Behavior**: Marks order as `validated` (ready for fulfillment)
- **UI**: "Validate" button for pending orders
- **Access**: Admin only

### 3. **Hold Order**
- **Function**: `hold_order(order_id, reason)`
- **Behavior**:
  - Puts order on hold (status: `processing`)
  - Stores hold reason in `customer_input` JSONB field
  - Can be resumed later
- **UI**: "Hold Order" button with optional reason input
- **Access**: Admin only

### 4. **Cancel Order**
- **Function**: `cancel_order(order_id, reason)`
- **Behavior**:
  - Cancels order (status: `failed`)
  - If order had an assigned key, releases it back to inventory (`status = 'available'`)
  - Stores cancellation reason
- **UI**: "Cancel" button with optional reason input
- **Access**: Admin only

### 5. **Refund Order**
- **Function**: `refund_order(order_id, reason)`
- **Behavior**:
  - Refunds completed orders
  - Releases assigned key back to inventory
  - Updates order status to `failed` with refund info
  - Stores refund details in `customer_input`
- **UI**: "Refund" button for completed orders
- **Access**: Admin only

### 6. **Inventory Availability Check**
- **Function**: `check_inventory_availability(product_id)`
- **Behavior**: Returns real-time count of available keys for a product
- **Usage**: Automatically checked before allowing fulfillment
- **Access**: Admin only

## Database Functions

All functions are defined in `supabase/migrations/20260208092000_admin_order_management.sql`:

- `fulfill_order_manual(UUID)` → JSONB
- `hold_order(UUID, TEXT)` → JSONB
- `cancel_order(UUID, TEXT)` → JSONB
- `refund_order(UUID, TEXT)` → JSONB
- `validate_order(UUID)` → JSONB
- `check_inventory_availability(UUID)` → JSONB

## Security

1. **Role-Based Access**: All functions check for admin role using `has_role()` function
2. **SECURITY DEFINER**: Functions run with elevated privileges to access inventory tables
3. **Row-Level Security**: Database RLS policies still apply
4. **Audit Logging**: All actions are logged in `audit_logs` table

## UI Components

### Admin Dashboard (`src/pages/AdminDashboard.tsx`)

**Order Actions Dropdown**:
- Context menu with all available actions per order
- Actions are contextually shown based on order status
- Confirmation dialogs for destructive actions

**Action Dialog**:
- Confirmation dialog for all order actions
- Shows order details (ID, product, total)
- Optional reason input for hold/cancel/refund
- Real-time inventory verification for fulfillment

## API Functions (`src/lib/shopApi.ts`)

```typescript
// Fulfill order (backend verifies inventory)
fulfillOrder(orderId: string)

// Hold order
holdOrder(orderId: string, reason?: string)

// Cancel order
cancelOrder(orderId: string, reason?: string)

// Refund order
refundOrder(orderId: string, reason?: string)

// Validate order
validateOrder(orderId: string)

// Check inventory
checkInventoryAvailability(productId: string)
```

## Workflow Examples

### Fulfilling an Order

1. Admin clicks "Fulfill Now" on an order
2. System checks `check_inventory_availability()` - verifies keys exist in database
3. If no keys: Shows error toast, prevents fulfillment
4. If keys available: Opens confirmation dialog
5. Admin confirms → `fulfill_order_manual()` is called
6. Backend:
   - Finds available key with `FOR UPDATE SKIP LOCKED` (prevents race conditions)
   - Assigns key to order
   - Marks key as `sold`
   - Updates order status to `completed`
   - Logs action in audit_logs
7. Frontend refreshes order list

### Cancelling an Order

1. Admin clicks "Cancel" on an order
2. Opens dialog with optional reason field
3. Admin confirms → `cancel_order()` is called
4. Backend:
   - Checks if order can be cancelled
   - If order has assigned key, releases it back to inventory
   - Updates order status to `failed`
   - Stores cancellation reason
   - Logs action
5. Frontend shows success toast and refreshes

### Refunding a Completed Order

1. Admin clicks "Refund" on a completed order
2. Opens dialog with optional reason field
3. Admin confirms → `refund_order()` is called
4. Backend:
   - Releases assigned key back to inventory
   - Updates order status to `failed`
   - Stores refund details
   - Logs action
5. Frontend shows success toast and refreshes

## Error Handling

All functions return JSONB with structure:
```json
{
  "success": boolean,
  "error": "error message" (if failed),
  "message": "success message" (if succeeded),
  "key_released": boolean (for cancel/refund)
}
```

Frontend handles errors and shows appropriate toast notifications.

## Real-Time Updates

- Order list automatically refreshes after any action
- Inventory counts update in real-time
- Stock levels reflect actual database state

## Important Notes

1. **Backend Verification**: Fulfillment **cannot** succeed unless keys exist in database
2. **Race Condition Prevention**: Uses `FOR UPDATE SKIP LOCKED` to prevent multiple admins from assigning the same key
3. **Key Release**: Cancelled/refunded orders automatically release keys back to inventory
4. **Audit Trail**: All actions are logged for accountability
5. **Status Validation**: Functions check order status before allowing actions (e.g., can't cancel completed orders)

## Testing

To test the system:

1. Create a test order
2. Add inventory keys to the product
3. Try to fulfill the order (should succeed)
4. Try to fulfill without keys (should fail)
5. Test cancel/refund/hold actions
6. Verify keys are released properly on cancel/refund

## Migration

The migration file `20260208092000_admin_order_management.sql` has been pushed to the remote database. All functions are now available in production.

