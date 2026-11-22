const crypto = require('crypto');

// Estados de Wompi -> estados del sistema
const STATUS_MAP = {
  APPROVED: 'APROBADO',
  DECLINED: 'RECHAZADO',
  VOIDED: 'ANULADO',
  ERROR: 'ERROR',
  PENDING: 'PENDIENTE'
};

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function getPath(object, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), object);
}

// Check del evento: valores de signature.properties (en orden) + timestamp + secreto de eventos
function buildChecksum(event, secret) {
  const properties = event && event.signature && event.signature.properties;
  if (!Array.isArray(properties) || !properties.length || !secret) return null;
  const values = properties.map((path) => getPath(event.data, path));
  if (values.some((value) => value === undefined || value === null)) return null;
  return sha256(values.join('') + String(event.timestamp) + secret);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyEvent(event, headerChecksum, secret) {
  const expected = buildChecksum(event, secret);
  const received = event && event.signature && event.signature.checksum;
  if (!expected || !received || !safeEqual(expected, received)) return false;
  return !headerChecksum || safeEqual(expected, headerChecksum);
}

// Convierte una transacción de Wompi al formato interno
function normalizeTransaction(transaction, source, raw) {
  return {
    transactionId: transaction.id,
    reference: transaction.reference,
    status: STATUS_MAP[transaction.status] || 'PENDIENTE',
    amount: Math.round(Number(transaction.amount_in_cents) / 100),
    source,
    raw
  };
}

module.exports = { STATUS_MAP, sha256, buildChecksum, verifyEvent, normalizeTransaction };
