const db = require('../../config/database');
const repo = require('./cell.repository');
const vehicleRepo = require('../vehicles/vehicle.repository');

const CELL_TYPES = ['AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA', 'OTRO'];
const STATUSES = ['LIBRE', 'OCUPADA', 'INACTIVA'];

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw fail(400, 'Identificador de celda no válido.');
  return id;
}

function normalizePlate(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').trim();
}

function parseCell(input) {
  const code = String(input.code || '').toUpperCase().replace(/\s+/g, '');
  const cellType = String(input.cellType || '').toUpperCase();
  if (!/^[A-Z0-9-]{1,10}$/.test(code)) {
    throw fail(400, 'El código es obligatorio (hasta 10 letras, números o guiones).');
  }
  if (!CELL_TYPES.includes(cellType)) throw fail(400, 'Tipo de celda no válido.');
  return { code, cellType };
}

function mapDuplicate(err) {
  if (err.code === 'ER_DUP_ENTRY') throw fail(409, 'Ya existe una celda con ese código.');
  throw err;
}

async function withTransaction(work) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function lockCell(id, conn) {
  const cell = await repo.findById(id, conn, true);
  if (!cell) throw fail(404, 'La celda no existe.');
  return cell;
}

async function list(query = {}) {
  const type = String(query.type || '').toUpperCase();
  const status = String(query.status || '').toUpperCase();
  if (type && !CELL_TYPES.includes(type)) throw fail(400, 'Tipo de celda no válido.');
  if (status && !STATUSES.includes(status)) throw fail(400, 'Estado de celda no válido.');
  const [cells, counts] = await Promise.all([repo.list({ type, status }), repo.countByStatus()]);
  const summary = { LIBRE: 0, OCUPADA: 0, INACTIVA: 0 };
  counts.forEach((row) => { summary[row.status] = Number(row.total); });
  return { cells, summary };
}

async function create(input) {
  const data = parseCell(input);
  try { return await repo.create(data); } catch (err) { return mapDuplicate(err); }
}

async function update(id, input) {
  const cellId = parseId(id);
  const data = parseCell(input);
  try {
    await withTransaction(async (conn) => {
      const cell = await lockCell(cellId, conn);
      if (cell.status === 'OCUPADA' && cell.cell_type !== data.cellType) {
        throw fail(409, 'No se puede cambiar el tipo de una celda ocupada.');
      }
      await repo.update(cellId, data, conn);
    });
  } catch (err) { mapDuplicate(err); }
  return repo.getView(cellId);
}

async function inactivate(id) {
  const cellId = parseId(id);
  await withTransaction(async (conn) => {
    const cell = await lockCell(cellId, conn);
    if (cell.status === 'OCUPADA') throw fail(409, 'No se puede inactivar una celda ocupada. Libérala primero.');
    if (cell.status === 'INACTIVA') throw fail(409, 'La celda ya está inactiva.');
    await repo.setStatus(cellId, 'INACTIVA', conn);
  });
  return repo.getView(cellId);
}

async function reactivate(id) {
  const cellId = parseId(id);
  await withTransaction(async (conn) => {
    const cell = await lockCell(cellId, conn);
    if (cell.status !== 'INACTIVA') throw fail(409, 'La celda no está inactiva.');
    await repo.setStatus(cellId, 'LIBRE', conn);
  });
  return repo.getView(cellId);
}

async function assign(id, input) {
  const cellId = parseId(id);
  const plate = normalizePlate(input.plate);
  if (plate.length < 5 || plate.length > 10) throw fail(400, 'La placa debe tener entre 5 y 10 caracteres.');

  await withTransaction(async (conn) => {
    const cell = await lockCell(cellId, conn);
    if (cell.status !== 'LIBRE') {
      throw fail(409, cell.status === 'OCUPADA' ? 'La celda ya está ocupada.' : 'La celda está inactiva y no se puede asignar.');
    }
    const vehicle = await vehicleRepo.findVehicleByPlate(plate, conn);
    if (!vehicle) throw fail(404, 'No existe un vehículo registrado con esa placa.');
    if (!(await vehicleRepo.findOpenMovement(vehicle.id, conn))) {
      throw fail(409, 'El vehículo no tiene una entrada abierta.');
    }
    if (vehicle.vehicle_type !== cell.cell_type) {
      throw fail(409, 'El tipo de la celda no corresponde al tipo del vehículo.');
    }
    const current = await repo.findByVehicle(vehicle.id, conn);
    if (current) throw fail(409, `El vehículo ya tiene asignada la celda ${current.code}.`);
    if (!(await repo.assign(cellId, vehicle.id, conn))) throw fail(409, 'La celda ya no está disponible.');
  });
  return repo.getView(cellId);
}

async function release(id) {
  const cellId = parseId(id);
  await withTransaction(async (conn) => {
    const cell = await lockCell(cellId, conn);
    if (cell.status !== 'OCUPADA') throw fail(409, 'Solo se puede liberar una celda ocupada.');
    await repo.setStatus(cellId, 'LIBRE', conn);
  });
  return repo.getView(cellId);
}

module.exports = { list, create, update, inactivate, reactivate, assign, release };
