const { buildChecksum, verifyEvent, normalizeTransaction } = require('./wompi-events');

// Pasarela de práctica: reproduce el formato y la firma de los eventos de Wompi
// sin cobrar dinero. Sirve para desarrollar y probar sin credenciales.
const name = 'SIMULADOR';
const OUTCOMES = { approved: 'APPROVED', declined: 'DECLINED', error: 'ERROR' };

const eventsSecret = () => process.env.SIMULATOR_EVENTS_SECRET || 'simulador-events';
const baseUrl = () => process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

function createCheckout({ reference }) {
  return { checkoutUrl: `${baseUrl()}/pasarela-simulada.html?reference=${encodeURIComponent(reference)}` };
}

function parseWebhook(headers, body) {
  if (!verifyEvent(body, headers['x-event-checksum'], eventsSecret())) {
    const error = new Error('La firma del evento no es válida.');
    error.status = 401;
    throw error;
  }
  if (body.event !== 'transaction.updated' || !body.data || !body.data.transaction) return null;
  return normalizeTransaction(body.data.transaction, 'WEBHOOK', { event: body.event });
}

// Construye un evento firmado, igual al que enviaría Wompi
function buildEvent(payment, outcome) {
  const status = OUTCOMES[outcome];
  if (!status) return null;
  const event = {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: `SIM-${Date.now()}`,
        reference: payment.reference,
        status,
        amount_in_cents: payment.amount * 100,
        currency: 'COP'
      }
    },
    signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'] },
    timestamp: Math.floor(Date.now() / 1000)
  };
  event.signature.checksum = buildChecksum(event, eventsSecret());
  return event;
}

async function fetchStatus() {
  return null; // el simulador no tiene un servicio externo que consultar
}

module.exports = { name, createCheckout, parseWebhook, buildEvent, fetchStatus };
