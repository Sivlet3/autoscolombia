const db = require('../../config/database');

async function findById(id, connection = db, forUpdate = false) {
  const [rows] = await connection.execute(
    `SELECT * FROM cells WHERE id = ?${forUpdate ? ' FOR UPDATE' : ''}`,
    [id]
  );
  return rows[0] || null;
}

async function getView(id) {
  const [rows] = await db.execute(
    `SELECT c.id, c.code, c.cell_type, c.status, c.vehicle_id, v.plate
    FROM cells c LEFT JOIN vehicles v ON v.id = c.vehicle_id
    WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function list({ type, status }) {
  const where = [];
  const params = [];
  if (type) { where.push('c.cell_type = ?'); params.push(type); }
  if (status) { where.push('c.status = ?'); params.push(status); }
  const [rows] = await db.execute(
    `SELECT c.id, c.code, c.cell_type, c.status, c.vehicle_id, v.plate
    FROM cells c LEFT JOIN vehicles v ON v.id = c.vehicle_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY c.code`,
    params
  );
  return rows;
}

async function countByStatus() {
  const [rows] = await db.execute('SELECT status, COUNT(*) AS total FROM cells GROUP BY status');
  return rows;
}

async function create({ code, cellType }) {
  const [result] = await db.execute(
    "INSERT INTO cells (code, cell_type, status) VALUES (?, ?, 'LIBRE')",
    [code, cellType]
  );
  return getView(result.insertId);
}

async function update(id, { code, cellType }, connection = db) {
  await connection.execute('UPDATE cells SET code = ?, cell_type = ? WHERE id = ?', [code, cellType, id]);
}

async function setStatus(id, status, connection = db) {
  await connection.execute('UPDATE cells SET status = ?, vehicle_id = NULL WHERE id = ?', [status, id]);
}

async function findByVehicle(vehicleId, connection = db) {
  const [rows] = await connection.execute('SELECT id, code FROM cells WHERE vehicle_id = ?', [vehicleId]);
  return rows[0] || null;
}

async function assign(id, vehicleId, connection = db) {
  const [result] = await connection.execute(
    "UPDATE cells SET status = 'OCUPADA', vehicle_id = ? WHERE id = ? AND status = 'LIBRE'",
    [vehicleId, id]
  );
  return result.affectedRows > 0;
}

module.exports = { findById, getView, list, countByStatus, create, update, setStatus, findByVehicle, assign };
