const db = require('../../config/database');

const FIELDS = 'id, document_type, document_number, full_name, phone, email, status, created_at';

async function findById(id, connection = db) {
  const [rows] = await connection.execute(`SELECT ${FIELDS} FROM clients WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ documentType, documentNumber, fullName, phone, email }) {
  const [result] = await db.execute(
    'INSERT INTO clients (document_type, document_number, full_name, phone, email) VALUES (?, ?, ?, ?, ?)',
    [documentType, documentNumber, fullName, phone, email || null]
  );
  return findById(result.insertId);
}

async function search(term) {
  const like = `%${term}%`;
  const [rows] = await db.execute(
    `SELECT c.id, c.document_type, c.document_number, c.full_name, c.phone, c.email, c.status,
           (SELECT string_agg(v.plate, ', ' ORDER BY v.plate)
              FROM vehicles v WHERE v.client_id = c.id) AS plates
    FROM clients c
    WHERE c.document_number ILIKE ? OR c.full_name ILIKE ?
    ORDER BY c.full_name
    LIMIT 200`,
    [like, like]
  );
  return rows;
}

async function update(id, { documentType, documentNumber, fullName, phone, email }) {
  await db.execute(
    'UPDATE clients SET document_type = ?, document_number = ?, full_name = ?, phone = ?, email = ? WHERE id = ?',
    [documentType, documentNumber, fullName, phone, email || null, id]
  );
  return findById(id);
}

async function setStatus(id, status) {
  await db.execute('UPDATE clients SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

async function listVehicles(clientId) {
  const [rows] = await db.execute(
    'SELECT id, plate, vehicle_type FROM vehicles WHERE client_id = ? ORDER BY plate',
    [clientId]
  );
  return rows;
}

async function linkVehicle(vehicleId, clientId, connection = db) {
  const [result] = await connection.execute(
    'UPDATE vehicles SET client_id = ? WHERE id = ? AND client_id IS NULL',
    [clientId, vehicleId]
  );
  return result.affectedRows > 0;
}

module.exports = { findById, create, search, update, setStatus, listVehicles, linkVehicle };
