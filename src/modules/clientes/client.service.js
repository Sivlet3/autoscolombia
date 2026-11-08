const db = require('../../config/database');
const repo = require('./client.repository');
const vehicleRepo = require('../vehicles/vehicle.repository');

const DOCUMENT_TYPES = ['CC', 'CE', 'PASAPORTE'];
const VEHICLE_TYPES = ['AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA', 'OTRO'];

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw fail(400, 'Identificador no válido.');
  return id;
}

function normalizePlate(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').trim();
}

function parseClient(input) {
  const documentType = String(input.documentType || '').toUpperCase();
  const documentNumber = String(input.documentNumber || '').replace(/\s+/g, '').toUpperCase();
  const fullName = String(input.fullName || '').trim();
  const phone = String(input.phone || '').trim();
  const email = String(input.email || '').trim();

  if (!DOCUMENT_TYPES.includes(documentType)) throw fail(400, 'Tipo de documento no válido.');
  if (!/^[A-Z0-9]{4,20}$/.test(documentNumber)) {
    throw fail(400, 'El número de documento debe tener entre 4 y 20 letras o números.');
  }
  if (!fullName || fullName.length > 120) {
    throw fail(400, 'El nombre completo es obligatorio (máximo 120 caracteres).');
  }
  if (!/^[0-9+\s-]{7,20}$/.test(phone)) {
    throw fail(400, 'El teléfono debe tener entre 7 y 20 caracteres (números, +, espacios o guiones).');
  }
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw fail(400, 'El correo electrónico no es válido.');
  }
  return { documentType, documentNumber, fullName, phone, email };
}

function mapDuplicate(err) {
  if (err.code === 'ER_DUP_ENTRY') throw fail(409, 'Ya existe un cliente con ese tipo y número de documento.');
  throw err;
}

async function create(input) {
  const data = parseClient(input);
  try { return await repo.create(data); } catch (err) { return mapDuplicate(err); }
}

async function list(term) {
  return repo.search(String(term || '').trim());
}

async function getById(id) {
  const clientId = parseId(id);
  const client = await repo.findById(clientId);
  if (!client) throw fail(404, 'El cliente no existe.');
  return { ...client, vehicles: await repo.listVehicles(clientId) };
}

async function update(id, input) {
  const clientId = parseId(id);
  const data = parseClient(input);
  if (!(await repo.findById(clientId))) throw fail(404, 'El cliente no existe.');
  try { return await repo.update(clientId, data); } catch (err) { return mapDuplicate(err); }
}

async function changeStatus(id, status) {
  const clientId = parseId(id);
  const client = await repo.findById(clientId);
  if (!client) throw fail(404, 'El cliente no existe.');
  if (client.status === status) {
    throw fail(409, status === 'INACTIVO' ? 'El cliente ya está inactivo.' : 'El cliente ya está activo.');
  }
  return repo.setStatus(clientId, status);
}

async function addVehicle(id, input) {
  const clientId = parseId(id);
  const plate = normalizePlate(input.plate);
  const vehicleType = String(input.vehicleType || 'AUTOMOVIL').toUpperCase();
  if (plate.length < 5 || plate.length > 10) throw fail(400, 'La placa debe tener entre 5 y 10 caracteres.');
  if (!VEHICLE_TYPES.includes(vehicleType)) throw fail(400, 'Tipo de vehículo no válido.');

  const client = await repo.findById(clientId);
  if (!client) throw fail(404, 'El cliente no existe.');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let vehicle = await vehicleRepo.findVehicleByPlate(plate, conn);
    if (!vehicle) {
      vehicle = await vehicleRepo.createVehicle({ plate, vehicleType, ownerName: client.full_name }, conn);
    } else if (vehicle.client_id) {
      throw fail(409, Number(vehicle.client_id) === clientId
        ? 'Esa placa ya está asociada a este cliente.'
        : 'Esa placa ya está asociada a otro cliente.');
    }
    if (!(await repo.linkVehicle(vehicle.id, clientId, conn))) {
      throw fail(409, 'Esa placa ya está asociada a un cliente.');
    }
    await conn.commit();
    return { id: vehicle.id, plate: vehicle.plate, vehicle_type: vehicle.vehicle_type, client_id: clientId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { create, list, getById, update, changeStatus, addVehicle };
