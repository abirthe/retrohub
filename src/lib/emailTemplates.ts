export function generateOrderEmailTemplate(order: { id: string; status: string; total: number; products?: { title?: string }; deliveries?: { delivery_code: string }[]; admin_notes?: string }, customerEmail: string): string {
  const status = order.status;
  const orderId = order.id.slice(0, 8).toUpperCase();
  const title = order.products?.title || 'Your Product';
  const price = Number(order.total).toFixed(2);
  let subject = `Order Update: #${orderId} - RetroHub`;
  let body = `Hello,\n\nHere is an update regarding your recent order on RetroHub.\n\nOrder Details:\n- Order ID: #${orderId}\n- Product: ${title}\n- Amount: ৳${price}\n\n`;

  switch (status) {
    case 'pending':
      subject = `Order Received: #${orderId} - Awaiting Payment Validation`;
      body += `Your order is currently pending. We are verifying your payment and will update you shortly.\n\nIf you have any questions, feel free to reply to this email.`;
      break;
    case 'processing':
      subject = `Order Processing: #${orderId} - Sourcing Product`;
      body += `Great news! Your payment has been verified. We are now processing your order and sourcing your product. You will receive another email once it is ready.\n\nThank you for your patience.`;
      break;
    case 'completed':
      subject = `Order Fulfilled: #${orderId} - Your Product is Ready!`;
      body += `Your order has been completely fulfilled! 🎉\n\n`;
      if (order.deliveries && order.deliveries.length > 0) {
        body += `Delivery Key / Details:\n`;
        order.deliveries.forEach((d) => {
          body += `\n----------------------------------------\n${d.delivery_code}\n----------------------------------------\n`;
        });
        body += `\nPlease redeem the key or follow the instructions provided above.\n`;
      }
      body += `\nThank you for shopping with RetroHub!`;
      break;
    case 'cancelled':
      subject = `Order Cancelled: #${orderId}`;
      body += `Unfortunately, your order has been cancelled.\n`;
      if (order.admin_notes) body += `\nReason: ${order.admin_notes}\n`;
      body += `\nIf you have any questions or believe this was an error, please let us know.`;
      break;
    case 'refunded':
      subject = `Order Refunded: #${orderId}`;
      body += `Your order has been refunded. The amount should reflect in your account shortly based on your payment provider.\n`;
      if (order.admin_notes) body += `\nReason: ${order.admin_notes}\n`;
      body += `\nWe hope to serve you again in the future!`;
      break;
    case 'on_hold':
      subject = `Order On Hold: #${orderId}`;
      body += `Your order has been placed on hold. We need to resolve an issue before we can proceed.\n`;
      if (order.admin_notes) body += `\nReason: ${order.admin_notes}\n`;
      body += `\nPlease reply to this email if you can help us resolve this faster.`;
      break;
    default:
      body += `Your order status is now: ${status}.\n\nThank you for shopping with RetroHub.`;
  }

  body += `\n\nBest regards,\nThe RetroHub Team\nhttps://retrohub.store`;

  return `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
