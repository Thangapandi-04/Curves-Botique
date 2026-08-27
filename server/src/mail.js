import nodemailer from 'nodemailer';
import { pool } from './db.js';

function mailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

function money(value) {
  return `INR ${Number(value || 0).toLocaleString('en-IN')}`;
}

function orderRows(items) {
  return items.map((item) => `<tr><td>${item.product_name} x ${item.quantity}</td><td>${money(item.subtotal)}</td></tr>`).join('');
}

export async function notifyConfirmedOrder(orderId, paymentMethod) {
  console.info('[RAZORPAY_EMAIL]', JSON.stringify({ orderId, paymentMethod, action: 'start' }));
  const [[[order]], [items], [admins]] = await Promise.all([
    pool.query('SELECT o.*,u.email customer_email,u.full_name customer_name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=? LIMIT 1', [orderId]),
    pool.query('SELECT product_name,quantity,subtotal FROM order_items WHERE order_id=? ORDER BY id', [orderId]),
    pool.query("SELECT email FROM users WHERE role='ADMIN' AND is_active=1"),
  ]);
  if (!order) return;

  const paymentLabel = paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay online payment';
  const subject = `CURVE order confirmation - ${order.order_code}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#222"><h1>CURVE</h1><h2>Order confirmed</h2><p>Thank you, ${order.customer_name}. Your order <strong>${order.order_code}</strong> has been created.</p><p>Payment method: <strong>${paymentLabel}</strong><br>Order status: <strong>${order.order_status}</strong></p><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;width:100%"><tbody>${orderRows(items)}<tr><td><strong>Total</strong></td><td><strong>${money(order.total)}</strong></td></tr></tbody></table><p>Shipping to: ${order.shipping_name}, ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state}, ${order.shipping_postal_code}, ${order.shipping_country}.</p><p>We will update you when the order is packed and dispatched.</p></div>`;
  const transport = mailTransport();
  if (!transport) {
    console.warn('[Mail] SMTP is not configured; order emails were skipped', order.order_code);
    console.info('[RAZORPAY_EMAIL]', JSON.stringify({ orderId, action: 'skipped', reason: 'smtp-not-configured' }));
  } else {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const recipients = [order.customer_email, ...admins.map((admin) => admin.email)].filter(Boolean);
    try {
      await Promise.all(recipients.map((to) => transport.sendMail({ from, to, subject, html })));
      console.info('[RAZORPAY_EMAIL]', JSON.stringify({ orderId, action: 'sent', recipientCount: recipients.length }));
    } catch (error) {
      console.error('[Mail] Order emails could not be sent', error.message);
      console.info('[RAZORPAY_EMAIL]', JSON.stringify({ orderId, action: 'failed' }));
    }
  }

  const [existingCustomerNotification] = await pool.query('SELECT id FROM notifications WHERE user_id=? AND title=? AND message LIKE ? LIMIT 1', [order.user_id, 'Order confirmed', `${order.order_code}%`]);
  if (!existingCustomerNotification.length) await pool.query('INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)', [order.user_id, 'Order confirmed', `Order ${order.order_code} was confirmed. Total ${money(order.total)}.`, 'order']);
  for (const admin of admins) {
    const [[adminUser]] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [admin.email]);
    if (adminUser) {
      const [existingAdminNotification] = await pool.query('SELECT id FROM notifications WHERE user_id=? AND title=? AND message LIKE ? LIMIT 1', [adminUser.id, 'New order received', `${order.order_code}%`]);
      if (!existingAdminNotification.length) await pool.query('INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)', [adminUser.id, 'New order received', `${order.order_code} from ${order.customer_name}. Total ${money(order.total)}.`, 'order']);
    }
  }
}
