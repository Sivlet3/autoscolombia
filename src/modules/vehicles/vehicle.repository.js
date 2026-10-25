const db = require('../../config/database');

async function findVehicleByPlate(plate, connection = db) {
  const [rows] = await connection.execute('SELECT * FROM vehicles WHERE plate = ?', [plate]);
  return rows[0] || null;
}

async function createVehicle({ plate, vehicleType, ownerName }, connection = db) {
  const [result] = await connection.execute(
    'INSERT INTO vehicles (plate, vehicle_type, owner_name) VALUES (?, ?, ?)',
    [plate, vehicleType, ownerName]
  );
  const [rows] = await connection.execute('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findOpenMovement(vehicleId, connection = db) {
  const [rows] = await connection.execute(
    "SELECT * FROM parking_movements WHERE vehicle_id = ? AND status = 'INSIDE' ORDER BY entry_at DESC LIMIT 1",
    [vehicleId]
  );
  return rows[0] || null;
}

async function createMovement({ vehicleId, notes }, connection = db) {
  const [result] = await connection.execute(
    "INSERT INTO parking_movements (vehicle_id, entry_notes, status) VALUES (?, ?, 'INSIDE')",
    [vehicleId, notes || null]
  );
  const [rows] = await connection.execute('SELECT * FROM parking_movements WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function listInside() {
  const [rows] = await db.execute(
    `SELECT pm.id AS movement_id, pm.entry_at, pm.entry_notes,
           v.id AS vehicle_id, v.plate, v.vehicle_type, v.owner_name
    FROM parking_movements pm
    JOIN vehicles v ON v.id = pm.vehicle_id
    WHERE pm.status = 'INSIDE'
    ORDER BY pm.entry_at DESC`
  );
  return rows;
}

async function closeMovement(id, notes) {
  const [result] = await db.execute(
    `UPDATE parking_movements
    SET exit_at = NOW(), exit_notes = ?, status = 'CLOSED'
    WHERE id = ? AND status = 'INSIDE'`,
    [notes || null, id]
  );
  if (!result.affectedRows) return null;
  const [rows] = await db.execute('SELECT * FROM parking_movements WHERE id = ?', [id]);
  return rows[0] || null;
}

async function historyByPlate(plate) {
  const [rows] = await db.execute(
    `SELECT pm.id AS movement_id, pm.entry_at, pm.exit_at, pm.status,
           pm.entry_notes, pm.exit_notes, v.plate, v.vehicle_type, v.owner_name
    FROM parking_movements pm JOIN vehicles v ON v.id = pm.vehicle_id
    WHERE v.plate = ? ORDER BY pm.entry_at DESC LIMIT 100`,
    [plate]
  );
  return rows;
}

module.exports = { findVehicleByPlate, createVehicle, findOpenMovement, createMovement, listInside, closeMovement, historyByPlate };
