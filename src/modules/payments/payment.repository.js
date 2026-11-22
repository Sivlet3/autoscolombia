const db = require('../../config/database');

const PAYMENT_VIEW = `
  SELECT p.id, p.reference, p.client_id, c.full_name AS client_name, c.document_type, c.document_number,
         c.email AS client_email, p.vehicle_id, v.plate, v.vehicle_type, p.concept, p.amount, p.currency,
         p.method, p.gateway, p.gateway_transaction_id, p.status, p.created_at, p.paid_at
  FROM payments p
  JOIN clients c ON c.id = p.client_id
  JOIN vehicles v ON v.id = p.vehicle_id`;

const MEMBERSHIP_VIEW = `
  SELECT * FROM (
    SELECT v.id AS vehicle_id, v.plate, v.vehicle_type, v.client_id, c.full_name, c.status AS client_status,
           m.valid_until::text AS valid_until,
           CASE WHEN m.valid_until IS NULL THEN 'SIN_MENSUALIDAD'
                WHEN m.valid_until < CURRENT_DATE THEN 'VENCIDA'
                WHEN m.valid_until <= CURRENT_DATE + 5 THEN 'POR_VENCER'
                ELSE 'VIGENTE' END AS membership_status,
           (m.valid_until - CURRENT_DATE) AS days_left
    FROM vehicles v
    LEFT JOIN clients c ON c.id = v.client_id
    LEFT JOIN (SELECT vehicle_id, MAX(valid_until) AS valid_until
               FROM memberships GROUP BY vehicle_id) m ON m.vehicle_id = v.id
  ) t`;

async function listRates() {
  const [rows] = await db.execute('SELECT vehicle_type, amount FROM monthly_rates ORDER BY amount');
  return rows;
}

async function getRate(vehicleType) {
  const [rows] = await db.execute('SELECT vehicle_type, amount FROM monthly_rates WHERE vehicle_type = ?', [vehicleType]);
  return rows[0] || null;
}

async function findVehicleWithClient(plate) {
  const [rows] = await db.execute(
    `SELECT v.id, v.plate, v.vehicle_type, v.client_id, c.full_name, c.phone, c.email,
            c.document_type, c.document_number, c.status AS client_status
     FROM vehicles v LEFT JOIN clients c ON c.id = v.client_id
     WHERE v.plate = ?`,
    [plate]
  );
  return rows[0] || null;
}

async function insertPayment(p, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO payments (reference, client_id, vehicle_id, amount, method, gateway, status, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.reference, p.clientId, p.vehicleId, p.amount, p.method, p.gateway || null, p.status, p.paidAt || null]
  );
  return result.insertId;
}

async function findById(id, connection = db, forUpdate = false) {
  const [rows] = await connection.execute(
    `${PAYMENT_VIEW} WHERE p.id = ?${forUpdate ? ' FOR UPDATE OF p' : ''}`, [id]
  );
  return rows[0] || null;
}

async function findByReference(reference, connection = db, forUpdate = false) {
  const [rows] = await connection.execute(
    `${PAYMENT_VIEW} WHERE p.reference = ?${forUpdate ? ' FOR UPDATE OF p' : ''}`, [reference]
  );
  return rows[0] || null;
}

async function list({ q, status }) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(v.plate ILIKE ? OR c.full_name ILIKE ? OR c.document_number ILIKE ? OR p.reference ILIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }
  const [rows] = await db.execute(
    `${PAYMENT_VIEW} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY p.created_at DESC LIMIT 200`,
    params
  );
  return rows;
}

async function updateStatus(id, { status, transactionId, paidAt }, connection = db) {
  await connection.execute(
    `UPDATE payments
     SET status = ?, gateway_transaction_id = COALESCE(?, gateway_transaction_id), paid_at = ?
     WHERE id = ?`,
    [status, transactionId || null, paidAt || null, id]
  );
}

async function addEvent(paymentId, eventType, payload, connection = db) {
  await connection.execute(
    'INSERT INTO payment_events (payment_id, event_type, payload) VALUES (?, ?, ?::jsonb)',
    [paymentId, eventType, JSON.stringify(payload || {})]
  );
}

async function listEvents(paymentId) {
  const [rows] = await db.execute(
    'SELECT id, event_type, payload, created_at FROM payment_events WHERE payment_id = ? ORDER BY id',
    [paymentId]
  );
  return rows;
}

// Un pago aprobado extiende un mes. Si ya hay mensualidad vigente, se agrega a continuación.
async function createMembership(paymentId, vehicleId, clientId, connection = db) {
  await connection.execute(
    `INSERT INTO memberships (payment_id, client_id, vehicle_id, valid_from, valid_until)
     SELECT ?::bigint, ?::bigint, ?::bigint, s.start_date,
            (s.start_date + INTERVAL '1 month' - INTERVAL '1 day')::date
     FROM (SELECT GREATEST(CURRENT_DATE,
                  COALESCE((SELECT MAX(valid_until) + 1 FROM memberships WHERE vehicle_id = ?::bigint), CURRENT_DATE)
                ) AS start_date) s
     ON CONFLICT (payment_id) DO NOTHING`,
    [paymentId, clientId, vehicleId, vehicleId]
  );
}

async function membershipByPlate(plate) {
  const [rows] = await db.execute(`${MEMBERSHIP_VIEW} WHERE t.plate = ?`, [plate]);
  return rows[0] || null;
}

async function listMemberships(status) {
  const [rows] = await db.execute(
    `${MEMBERSHIP_VIEW}
     WHERE t.client_id IS NOT NULL ${status ? 'AND t.membership_status = ?' : ''}
     ORDER BY t.valid_until NULLS FIRST, t.plate
     LIMIT 300`,
    status ? [status] : []
  );
  return rows;
}

module.exports = {
  listRates, getRate, findVehicleWithClient, insertPayment, findById, findByReference, list,
  updateStatus, addEvent, listEvents, createMembership, membershipByPlate, listMemberships
};
