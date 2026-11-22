const { sha256, verifyEvent, normalizeTransaction } = require('./wompi-events');

const name = 'WOMPI';
const CHECKOUT_URL = 'https://checkout.wompi.co/p/';
const API_URL = {
  sandbox: 'https://sandbox.wompi.co/v1',
  production: 'https://production.wompi.co/v1'
};
const LEGAL_ID_TYPE = { CC: 'CC', CE: 'CE', PASAPORTE: 'PP' };

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function secret(variable) {
  const value = process.env[variable];
  if (!value) throw fail(502, `La pasarela Wompi no está configurada (falta ${variable}).`);
  return value;
}

// Firma de integridad: SHA256(referencia + monto en centavos + moneda + secreto de integridad)
function integritySignature({ reference, amountInCents, currency }) {
  return sha256(`${reference}${amountInCents}${currency}${secret('WOMPI_INTEGRITY_SECRET')}`);
}

function createCheckout({ reference, amount, currency, customer, redirectUrl }) {
  const amountInCents = Math.round(amount * 100);
  const params = new URLSearchParams({
    'public-key': secret('WOMPI_PUBLIC_KEY'),
    currency,
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': integritySignature({ reference, amountInCents, currency }),
    'redirect-url': redirectUrl
  });
  if (customer) {
    if (customer.email) params.set('customer-data:email', customer.email);
    if (customer.fullName) params.set('customer-data:full-name', customer.fullName);
    const phone = String(customer.phone || '').replace(/\D/g, '');
    if (phone.length === 10) {
      params.set('customer-data:phone-number', phone);
      params.set('customer-data:phone-number-prefix', '+57');
    }
    if (customer.documentNumber && LEGAL_ID_TYPE[customer.documentType]) {
      params.set('customer-data:legal-id', customer.documentNumber);
      params.set('customer-data:legal-id-type', LEGAL_ID_TYPE[customer.documentType]);
    }
  }
  return { checkoutUrl: `${CHECKOUT_URL}?${params.toString()}` };
}

// Evento enviado por Wompi a la URL de eventos (webhook)
function parseWebhook(headers, body) {
  if (!verifyEvent(body, headers['x-event-checksum'], secret('WOMPI_EVENTS_SECRET'))) {
    throw fail(401, 'La firma del evento no es válida.');
  }
  if (body.event !== 'transaction.updated' || !body.data || !body.data.transaction) return null;
  return normalizeTransaction(body.data.transaction, 'WEBHOOK', { event: body.event });
}

async function getJson(url, headers = {}) {
  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  } catch (error) {
    throw fail(502, 'No fue posible comunicarse con la pasarela.');
  }
  if (response.status === 404) return null;
  if (!response.ok) throw fail(502, 'La pasarela respondió con un error.');
  return response.json();
}

// Consulta el estado real en Wompi (nunca se confía solo en la redirección del navegador)
async function fetchStatus(payment, hintTransactionId) {
  const base = API_URL[process.env.WOMPI_ENV === 'production' ? 'production' : 'sandbox'];
  let transaction = null;
  if (hintTransactionId) {
    const result = await getJson(`${base}/transactions/${encodeURIComponent(hintTransactionId)}`);
    transaction = result && result.data;
  } else {
    const result = await getJson(
      `${base}/transactions?reference=${encodeURIComponent(payment.reference)}`,
      { Authorization: `Bearer ${secret('WOMPI_PRIVATE_KEY')}` }
    );
    const data = result && result.data;
    transaction = Array.isArray(data) ? data[0] : data;
  }
  if (!transaction) return null;
  if (transaction.reference !== payment.reference) {
    throw fail(409, 'La transacción consultada no corresponde a este pago.');
  }
  return normalizeTransaction(transaction, 'SYNC', { fetched: true });
}

module.exports = { name, createCheckout, parseWebhook, fetchStatus, integritySignature };
