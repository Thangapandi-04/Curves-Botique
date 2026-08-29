// MSG91 WhatsApp integration, isolated from order/payment business logic.
// Order-confirmation notifications are sent exclusively through this service - no SMS, no email.
import { pool } from './db.js';

// Credentials/config are read only from process.env (populated from server/.env). Never hard-code
// them here and never return them to a caller that could expose them to the frontend.
function whatsappClient() {
  const { WHATSAPP_API_URL, WHATSAPP_AUTH_KEY, WHATSAPP_TEMPLATE_NAME, WHATSAPP_INTEGRATED_NUMBER, WHATSAPP_TEMPLATE_LANGUAGE, WHATSAPP_TEMPLATE_NAMESPACE } = process.env;
  if (!WHATSAPP_API_URL || !WHATSAPP_AUTH_KEY || !WHATSAPP_TEMPLATE_NAME || !WHATSAPP_INTEGRATED_NUMBER || !WHATSAPP_TEMPLATE_NAMESPACE) return null;
  return {
    apiUrl: WHATSAPP_API_URL,
    authKey: WHATSAPP_AUTH_KEY,
    templateName: WHATSAPP_TEMPLATE_NAME,
    templateNamespace: WHATSAPP_TEMPLATE_NAMESPACE,
    integratedNumber: WHATSAPP_INTEGRATED_NUMBER,
    templateLanguage: WHATSAPP_TEMPLATE_LANGUAGE || 'en',
  };
}

// MSG91 WhatsApp expects the destination number with country code and no '+' (e.g. 91XXXXXXXXXX).
function normalizeIndianMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 13 && digits.startsWith('091')) return `91${digits.slice(3)}`;
  return digits.length >= 10 ? digits : null;
}

// Never log a full phone number.
function maskMobile(mobile) {
  const value = String(mobile || '');
  return value.length > 4 ? `${'*'.repeat(value.length - 4)}${value.slice(-4)}` : '****';
}

async function alreadySent(orderId) {
  const [[row]] = await pool.query('SELECT whatsapp_confirmation_sent_at FROM orders WHERE id=? LIMIT 1', [orderId]);
  return Boolean(row?.whatsapp_confirmation_sent_at);
}

async function markSent(orderId) {
  await pool.query('UPDATE orders SET whatsapp_confirmation_sent_at=NOW() WHERE id=? AND whatsapp_confirmation_sent_at IS NULL', [orderId]);
}

function buildTemplateComponents(variables) {
  return Object.fromEntries(variables.map((value, index) => [`body_${index + 1}`, { type: 'text', value }]));
}

const HTTP_STATUS_MEANING = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 429: 'Rate Limited', 500: 'Internal Server Error', 502: 'Bad Gateway/Service unavailable', 503: 'Service unavailable', 504: 'Gateway Timeout/Service unavailable' };

// Calls MSG91 and throws a detailed error (including HTTP status and the raw response body) on
// failure so callers can log/return the exact reason instead of a generic message. Verbose
// request/response diagnostics are logged to the server terminal only - never returned to a caller.
async function callMsg91(client, normalizedMobile, components) {
  const payload = {
    integrated_number: client.integratedNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: client.templateName,
        language: { code: client.templateLanguage, policy: 'deterministic' },
        namespace: client.templateNamespace,
        to_and_components: [{ to: [normalizedMobile], components }],
      },
    },
  };
  const redactedPayload = { ...payload, integrated_number: maskMobile(client.integratedNumber), payload: { ...payload.payload, template: { ...payload.payload.template, to_and_components: [{ to: [maskMobile(normalizedMobile)], components }] } } };

  console.info('[WHATSAPP_DEBUG] MSG91 REQUEST', JSON.stringify({
    url: client.apiUrl,
    method: 'POST',
    authHeaderConfigured: Boolean(client.authKey),
    authKey: 'MASKED',
    contentType: 'application/json',
    integratedNumber: maskMobile(client.integratedNumber),
    templateName: client.templateName,
    templateLanguage: client.templateLanguage,
    destinationMobile: maskMobile(normalizedMobile),
    requestBody: redactedPayload,
  }));

  let response;
  try {
    response = await fetch(client.apiUrl, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', authkey: client.authKey },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error('[WHATSAPP_DEBUG] NETWORK ERROR', JSON.stringify({ errorType: networkError.name, errorMessage: networkError.message, cause: networkError.cause ? String(networkError.cause) : null }));
    throw Object.assign(new Error(`Could not reach MSG91 WhatsApp API: ${networkError.message}`), { cause: networkError, handled: true });
  }

  try {
    const rawBody = await response.text();
    let result = {};
    try { result = rawBody ? JSON.parse(rawBody) : {}; } catch { /* non-JSON response body, keep rawBody for diagnostics */ }

    console.info('[WHATSAPP_DEBUG] MSG91 RESPONSE', JSON.stringify({
      httpStatus: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      rawResponseBody: rawBody,
    }));

    if (!response.ok || result.type === 'error') {
      console.error('[WHATSAPP_DEBUG] MSG91 HTTP ERROR', JSON.stringify({ status: response.status, meaning: HTTP_STATUS_MEANING[response.status] || 'Unknown Error' }));
      if (response.status === 401) {
        console.error('[WHATSAPP_DEBUG] AUTHENTICATION ERROR');
        console.error('MSG91 returned HTTP 401 Unauthorized.');
        console.error('Check MSG91 authkey, endpoint, and WhatsApp API authorization. This could be an authentication, endpoint, or account/API authorization issue.');
      }
      throw Object.assign(new Error(result.message || result.errors || `MSG91 WhatsApp responded with status ${response.status}`), {
        status: response.status,
        responseBody: rawBody,
        handled: true,
      });
    }
    return result;
  } catch (error) {
    if (!error.handled) console.error('[WHATSAPP_DEBUG] UNEXPECTED ERROR', JSON.stringify({ errorType: error.name, errorMessage: error.message, stack: error.stack }));
    throw error;
  }
}

// order must include: id, order_code, customer_name, total, created_at, shipping_mobile.
// Never throws - a WhatsApp failure must never affect a confirmed order/payment.
export async function sendOrderConfirmationWhatsApp(order) {
  const orderCode = order?.order_code;
  if (await alreadySent(order.id)) {
    console.info('[WHATSAPP]', JSON.stringify({ orderCode, action: 'skipped', reason: 'already-sent' }));
    return;
  }
  const normalizedMobile = normalizeIndianMobile(order.shipping_mobile);
  if (!normalizedMobile) {
    console.warn('[WHATSAPP]', JSON.stringify({ orderCode, action: 'skipped', reason: 'missing-or-invalid-registered-mobile-number' }));
    return;
  }
  const client = whatsappClient();
  if (!client) {
    console.warn('[WHATSAPP]', JSON.stringify({ orderCode, mobile: maskMobile(normalizedMobile), action: 'skipped', reason: 'whatsapp-gateway-not-configured', required: ['WHATSAPP_API_URL', 'WHATSAPP_AUTH_KEY', 'WHATSAPP_TEMPLATE_NAME', 'WHATSAPP_INTEGRATED_NUMBER'] }));
    return;
  }

  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  // Maps the template variables {{1}}..{{4}}: customer name, order id, order date, total amount.
  const variables = [String(order.customer_name || 'Customer'), String(orderCode), orderDate, Number(order.total || 0).toLocaleString('en-IN')];

  try {
    const result = await callMsg91(client, normalizedMobile, buildTemplateComponents(variables));
    await markSent(order.id);
    console.info('[WHATSAPP]', JSON.stringify({ orderCode, mobile: maskMobile(normalizedMobile), action: 'sent', requestId: result.request_id || result.requestId || null }));
  } catch (error) {
    console.error('[WHATSAPP] Order confirmation WhatsApp message could not be sent', JSON.stringify({ orderCode, mobile: maskMobile(normalizedMobile), status: error.status || null, error: error.message, responseBody: error.responseBody || null }));
  }
}

// Used by the admin "test WhatsApp" endpoint. Unlike sendOrderConfirmationWhatsApp, this
// re-throws on failure so the caller (Postman/admin UI) sees the exact MSG91 error.
export async function sendTestWhatsApp({ mobile, customerName, orderCode, total }) {
  const normalizedMobile = normalizeIndianMobile(mobile);
  if (!normalizedMobile) throw Object.assign(new Error('A valid mobile number is required (10-digit Indian number, with or without country code)'), { status: 400 });
  const client = whatsappClient();
  if (!client) {
    throw Object.assign(new Error('WhatsApp gateway is not configured'), {
      status: 503,
      missing: ['WHATSAPP_API_URL', 'WHATSAPP_AUTH_KEY', 'WHATSAPP_TEMPLATE_NAME', 'WHATSAPP_INTEGRATED_NUMBER'].filter((key) => !process.env[key]),
    });
  }
  const orderDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const variables = [String(customerName || 'Customer'), String(orderCode || 'TEST-0001'), orderDate, Number(total || 0).toLocaleString('en-IN')];
  try {
    const result = await callMsg91(client, normalizedMobile, buildTemplateComponents(variables));
    console.info('[WHATSAPP_TEST]', JSON.stringify({ mobile: maskMobile(normalizedMobile), action: 'sent', requestId: result.request_id || result.requestId || null }));
    return result;
  } catch (error) {
    console.error('[WHATSAPP_TEST] Test WhatsApp message failed', JSON.stringify({ mobile: maskMobile(normalizedMobile), status: error.status || null, error: error.message, responseBody: error.responseBody || null }));
    throw error;
  }
}
