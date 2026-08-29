import { pool } from './db.js';
import { sendOrderConfirmationWhatsApp } from './whatsapp.js';

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function maskMobile(mobile) {
  const value = String(mobile || '');
  return value.length > 4 ? `${'*'.repeat(value.length - 4)}${value.slice(-4)}` : '****';
}

// Idempotent notification insert: a notification for the same user/title/order-code combination
// is created at most once, so repeated payment callbacks (webhook retries, duplicate verify calls)
// never produce duplicate notifications.
async function insertNotificationOnce(userId, title, message, type, dedupeKey) {
  const [existing] = await pool.query('SELECT id FROM notifications WHERE user_id=? AND title=? AND message LIKE ? LIMIT 1', [userId, title, `%${dedupeKey}%`]);
  if (existing.length) return false;
  await pool.query('INSERT INTO notifications(user_id,title,message,type) SELECT ?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=? AND title=? AND message LIKE ?)', [userId, title, message, type, userId, title, `%${dedupeKey}%`]);
  return true;
}

// Single entry point for order-confirmation notifications, called after the order/payment status
// has already been committed by the caller (Razorpay verify, Razorpay webhook, COD placement).
// Order confirmation is sent to the customer only via WhatsApp (MSG91) - no SMS, no email.
export async function notifyConfirmedOrder(orderId, paymentMethod) {
  const [[[order]], [admins]] = await Promise.all([
    pool.query('SELECT o.*,u.full_name customer_name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=? LIMIT 1', [orderId]),
    pool.query("SELECT id FROM users WHERE role='ADMIN' AND is_active=1"),
  ]);
  if (!order) return;

  // Customer notification: created for the authenticated owner of the order (order.user_id),
  // stored in the shared notifications table, returned by GET /api/me/notifications and
  // guaranteed to be created at most once per order.
  const customerMessage = paymentMethod === 'COD'
    ? `Your COD order #${order.order_code} has been confirmed successfully.`
    : `Your payment was successful and your order #${order.order_code} has been confirmed.`;
  const created = await insertNotificationOnce(order.user_id, 'Order confirmed', customerMessage, 'order', order.order_code);
  console.info('[ORDER_NOTIFICATION]', JSON.stringify({ orderId, userId: order.user_id, paymentMethod, created }));

  // Order confirmation via WhatsApp (MSG91), using the customer's registered mobile number
  // (order.shipping_mobile). Deduplicated internally via orders.whatsapp_confirmation_sent_at.
  console.info('[ORDER_NOTIFICATION_DEBUG]', JSON.stringify({
    orderId,
    orderCode: order.order_code,
    paymentMethod,
    orderStatus: order.order_status,
    hasShippingMobile: Boolean(order.shipping_mobile),
    shippingMobileMasked: maskMobile(order.shipping_mobile),
    invokingWhatsApp: true,
  }));
  await sendOrderConfirmationWhatsApp(order);

  // Admin notification: reuses the same notifications table/API so Admin sees it through the
  // existing notification mechanism (GET /api/me/notifications while logged in as ADMIN).
  const dateTime = new Date().toLocaleString('en-IN');
  const adminTitle = paymentMethod === 'COD' ? 'New COD order' : 'New Order Payment';
  const adminMessage = paymentMethod === 'COD'
    ? `New COD order #${order.order_code} requires payment/fulfillment management.`
    : [
        'New Order Payment',
        `Order: #${order.order_code}`,
        `Customer: ${order.customer_name}`,
        `Amount: ${rupees(order.total)}`,
        'Payment Type: Razorpay',
        'Payment Status: CAPTURED',
        `Order Status: ${order.order_status}`,
        `Date: ${dateTime}`,
      ].join('\n');
  for (const admin of admins) {
    await insertNotificationOnce(admin.id, adminTitle, adminMessage, paymentMethod === 'COD' ? 'cod_pending' : 'admin_payment', order.order_code);
  }
}

