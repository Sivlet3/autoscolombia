const db = require('../../config/database');
const repo = require('./vehicle.repository');

function normalizePlate(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').trim();
}

async function registerEntry(input) {
  const plate = normalizePlate(input.plate);
  const vehicleType = String(input.vehicleType || 'AUTOMOVIL').toUpperCase();
  const ownerName = String(input.ownerName || '').trim();
  const notes = String(input.notes || '').trim();

  if (plate.length < 5 || plate.length > 10) {
    const e = new Error('La placa debe tener entre 5 y 10 caracteres.'); e.status = 400; throw e;
  }
  if (!ownerName || ownerName.length > 120) {
    const e = new Error('El nombre del propietario/responsable es obligatorio (máximo 120 caracteres).'); e.status = 400; throw e;
  }
  if (!['AUTOMOVIL','MOTOCICLETA','CAMIONETA','OTRO'].includes(vehicleType)) {
    const e = new Error('Tipo de vehículo no válido.'); e.status = 400; throw e;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let vehicle = await repo.findVehicleByPlate(plate, conn);
    if (!vehicle) vehicle = await repo.createVehicle({ plate, vehicleType, ownerName }, conn);
    const open = await repo.findOpenMovement(vehicle.id, conn);
    if (open) {
      const e = new Error('Este vehículo ya tiene una entrada abierta.'); e.status = 409; throw e;
    }
    const movement = await repo.createMovement({ vehicleId: vehicle.id, notes }, conn);
    await conn.commit();
    return { vehicle, movement };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function registerExit(movementId, notes) {
  if (!Number.isInteger(Number(movementId)) || Number(movementId) <= 0) {
    const e = new Error('Identificador de movimiento no válido.'); e.status = 400; throw e;
  }
  const movement = await repo.closeMovement(Number(movementId), String(notes || '').trim());
  if (!movement) {
    const e = new Error('No existe una entrada abierta con ese identificador.'); e.status = 404; throw e;
  }
  const durationMinutes = Math.max(0, Math.round((new Date(movement.exit_at) - new Date(movement.entry_at)) / 60000));
  return { ...movement, durationMinutes };
}

async function history(plate) {
  const normalized = normalizePlate(plate);
  if (!normalized) { const e = new Error('Debes indicar una placa.'); e.status = 400; throw e; }
  return repo.historyByPlate(normalized);
}

module.exports = { registerEntry, registerExit, listInside: repo.listInside, history };
