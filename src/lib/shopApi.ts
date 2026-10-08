/**
 * @deprecated shopApi.ts is now a compatibility barrel.
 * Import directly from the specific module for new code:
 *   - '@/lib/types'          → shared types & interfaces
 *   - '@/lib/productApi'     → product catalog, CRUD, featured
 *   - '@/lib/orderApi'       → order creation, admin operations, stats
 *   - '@/lib/paymentApi'     → bKash TrxID submission
 *   - '@/lib/customOrderApi' → custom order requests
 *   - '@/lib/authApi'        → role checks
 *
 * All existing imports from '@/lib/shopApi' continue to work unchanged.
 */

// ─── Re-exports (backwards compatibility) ─────────────────────────────────────
export type {
  ProductCategory,
  DeliveryType,
  Region,
  OrderStatus,
  AppRole,
  Product,
  Order,
  Profile,
  AuditLog,
  Delivery,
  AdminActionLog,
  CustomOrderPayload,
  CustomOrderRow,
} from "./types";

export {
  fetchProducts,
  fetchStoreProducts,
  fetchProductsByIds,
  updateProductPrice,
  updateProductDetails,
  createProduct,
  fetchFeaturedProductIds,
  updateFeaturedProductIds,
} from "./productApi";

export {
  createOrder,
  fetchOrders,
  fetchOrderDeliveries,
  fetchAdminStats,
  validateOrder,
  startSourcing,
  fulfillOrder,
  holdOrder,
  cancelOrder,
  cancelUnpaidOrder,
  expireStaleOrders,
  refundOrder,
} from "./orderApi";

export { updateOrderTransactionId } from "./paymentApi";

export {
  submitCustomOrder,
  fetchCustomOrders,
  updateCustomOrderStatus,
} from "./customOrderApi";

export { checkIsAdmin } from "./authApi";
