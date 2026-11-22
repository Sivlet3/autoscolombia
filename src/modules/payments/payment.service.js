const crypto = require('crypto');
const db = require('../../config/database');
const repo = require('./payment.repository');
const gateways = require('./gateways');

const METHODS = ['PASARELA', 'EFECTIVO'];
const PAYMENT_STATUSES = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR'];
const MEMBERSHIP_STATUSES = ['VIGENTE', 'POR_VENCER', 'VENCIDA', 'SIN_MENSUALIDAD'];

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizePlate(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').trim();
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw fail(400, 'Identificador de pago no válido.');
  return id;
}

function newReference() {
  return `AC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function baseUrl() {
  return process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

async function withTransaction(work) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Reglas de transición (RN-21): una aprobación de la pasarela siempre sera respetada,
// pues el dinero ya fue recibido; los demás estados solo aplican a pagos pendientes.
function nextStatus(current, incoming) {
  if (incoming === 'PENDIENTE' || current === 'APROBADO') return null;
  if (incoming === 'APROBADO') return 'APROBADO';
  return current === 'PENDIENTE' ? incoming : null;
}

async function getById(id) {
  const payment = await repo.findById(parseId(id));
  if (!payment) throw fail(404, 'El pago no existe.');
  return { ...payment, events: await repo.listEvents(payment.id) };
}

async function list(query = {}) {
  const status = String(query.status || '').toUpperCase();
  if (status && !PAYMENT_STATUSES.includes(status)) throw fail(400, 'Estado de pago no válido.');
  return repo.list({ q: String(query.q || '').trim(), status });
}

async function create(input) {
  const plate = normalizePlate(input.plate);
  const method = String(input.method || '').toUpperCase();
  if (plate.length < 5 || plate.length > 10) throw fail(400, 'La placa debe tener entre 5 y 10 caracteres.');
  if (!METHODS.includes(method)) throw fail(400, 'Método de pago no válido (PASARELA o EFECTIVO).');

  const vehicle = await repo.findVehicleWithClient(plate);
  if (!vehicle) throw fail(404, 'No existe un vehículo registrado con esa placa.');
  if (!vehicle.client_id) throw fail(409, 'El vehículo no está asociado a un cliente. Asócialo primero en Clientes.');
  if (vehicle.client_status !== 'ACTIVO') throw fail(409, 'El cliente está inactivo.');
  const rate = await repo.getRate(vehicle.vehicle_type);
  if (!rate) throw fail(409, 'No hay una tarifa configurada para este tipo de vehículo.');

  const amount = Number(rate.amount);
  const reference = newReference();

  if (method === 'EFECTIVO') {
    const id = await withTransaction(async (connection) => {
      const paymentId = await repo.insertPayment({
        reference, clientId: vehicle.client_id, vehicleId: vehicle.id, amount,
        method, status: 'APROBADO', paidAt: new Date()
      }, connection);
      await repo.addEvent(paymentId, 'PAGO_EFECTIVO', { amount }, connection);
      await repo.createMembership(paymentId, vehicle.id, vehicle.client_id, connection);
      return paymentId;
    });
    return getById(id);
  }

  const gateway = gateways.current();
  let checkoutUrl;
  const id = await withTransaction(async (connection) => {
    let paymentId;
    try {
      paymentId = await repo.insertPayment({
        reference, clientId: vehicle.client_id, vehicleId: vehicle.id, amount,
        method, gateway: gateway.name, status: 'PENDIENTE'
      }, connection);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw fail(409, 'Este vehículo ya tiene un pago pendiente. Anúlalo o espera su confirmación.');
      }
      throw error;
    }
    ({ checkoutUrl } = gateway.createCheckout({
      reference, amount, currency: 'COP',
      redirectUrl: `${baseUrl()}/pago-resultado.html?ref=${encodeURIComponent(reference)}`,
      customer: {
        email: vehicle.email, fullName: vehicle.full_name, phone: vehicle.phone,
        documentType: vehicle.document_type, documentNumber: vehicle.document_number
      }
    }));
    await repo.addEvent(paymentId, 'CHECKOUT_CREADO', { gateway: gateway.name, amount }, connection);
    return paymentId;
  });
  return { ...(await getById(id)), checkoutUrl };
}

// Aplica el resultado informado por la pasarela (webhook o consulta directa). Es idempotente.
async function applyResult({ reference, transactionId, status, amount, source }) {
  return withTransaction(async (connection) => {
    const payment = await repo.findByReference(reference, connection, true);
    if (!payment) return { ignored: 'REFERENCIA_DESCONOCIDA' };

    if (amount !== undefined && Number(amount) !== Number(payment.amount)) {
      await repo.addEvent(payment.id, 'MONTO_NO_COINCIDE',
        { source, received: amount, expected: payment.amount }, connection);
      return { payment, ignored: 'MONTO_NO_COINCIDE' };
    }

    await repo.addEvent(payment.id, `RESULTADO_${source}`, { status, transactionId }, connection);
    const next = nextStatus(payment.status, status);
    if (!next) return { payment, changed: false };

    await repo.updateStatus(payment.id, {
      status: next, transactionId, paidAt: next === 'APROBADO' ? new Date() : null
    }, connection);
    if (next === 'APROBADO') {
      await repo.createMembership(payment.id, payment.vehicle_id, payment.client_id, connection);
    }
    return { payment: await repo.findById(payment.id, connection), changed: true };
  });
}

async function handleWebhook(headers, body) {
  const gateway = gateways.current();
  const result = gateway.parseWebhook(headers || {}, body || {});
  if (!result) return { received: true, ignored: 'EVENTO_NO_SOPORTADO' };
  const applied = await applyResult(result);
  return {
    received: true,
    ignored: applied.ignored,
    status: applied.payment ? applied.payment.status : undefined
  };
}

// Consulta el estado en la pasarela y lo aplica si el pago sigue pendiente
async function sync(paymentId, hintTransactionId) {
  const payment = await repo.findById(parseId(paymentId));
  if (!payment) throw fail(404, 'El pago no existe.');
  if (payment.method !== 'PASARELA' || payment.status !== 'PENDIENTE') return getById(payment.id);
  const result = await gateways.current().fetchStatus(payment, hintTransactionId);
  if (result) await applyResult(result);
  return getById(payment.id);
}

async function getByReference(reference, hintTransactionId) {
  const payment = await repo.findByReference(String(reference || '').trim());
  if (!payment) throw fail(404, 'El pago no existe.');
  try {
    return await sync(payment.id, hintTransactionId);
  } catch (error) {
    if (error.status === 502 || error.status === 409) return getById(payment.id); // conserva el estado actual
    throw error;
  }
}

async function cancel(idValue) {
  const id = parseId(idValue);
  await withTransaction(async (connection) => {
    const payment = await repo.findById(id, connection, true);
    if (!payment) throw fail(404, 'El pago no existe.');
    if (payment.status !== 'PENDIENTE') throw fail(409, 'Solo se puede anular un pago pendiente.');
    await repo.updateStatus(id, { status: 'ANULADO' }, connection);
    await repo.addEvent(id, 'ANULADO_MANUAL', {}, connection);
  });
  return getById(id);
}

// Solo con la pasarela simulada: reproduce el evento que enviaría la pasarela real
async function simulate(reference, outcome) {
  const gateway = gateways.current();
  if (typeof gateway.buildEvent !== 'function') throw fail(404, 'Ruta no encontrada');
  const payment = await repo.findByReference(String(reference || '').trim());
  if (!payment) throw fail(404, 'El pago no existe.');
  const event = gateway.buildEvent(payment, String(outcome || '').toLowerCase());
  if (!event) throw fail(400, 'Resultado no válido (approved, declined o error).');
  return handleWebhook({}, event);
}

async function rates() {
  return repo.listRates();
}

function config() {
  const gateway = gateways.current();
  return { gateway: gateway.name, currency: 'COP', simulated: typeof gateway.buildEvent === 'function' };
}

async function membershipStatus(plateValue) {
  const plate = normalizePlate(plateValue);
  if (plate.length < 5 || plate.length > 10) throw fail(400, 'La placa debe tener entre 5 y 10 caracteres.');
  const membership = await repo.membershipByPlate(plate);
  if (!membership) throw fail(404, 'No existe un vehículo registrado con esa placa.');
  return membership;
}

async function listMemberships(query = {}) {
  const status = String(query.status || '').toUpperCase();
  if (status && !MEMBERSHIP_STATUSES.includes(status)) throw fail(400, 'Estado de mensualidad no válido.');
  return repo.listMemberships(status);
}

module.exports = {
  create, list, getById, getByReference, sync, cancel, handleWebhook, simulate,
  rates, config, membershipStatus, listMemberships
};
