const service = require('./client.service');

async function create(req, res, next) {
  try {
    res.status(201).json({ message: 'Cliente registrado correctamente.', data: await service.create(req.body || {}) });
  } catch (e) { next(e); }
}
async function list(req, res, next) {
  try { res.json({ data: await service.list(req.query.q) }); } catch (e) { next(e); }
}
async function get(req, res, next) {
  try { res.json({ data: await service.getById(req.params.id) }); } catch (e) { next(e); }
}
async function update(req, res, next) {
  try {
    res.json({ message: 'Cliente actualizado correctamente.', data: await service.update(req.params.id, req.body || {}) });
  } catch (e) { next(e); }
}
async function inactivate(req, res, next) {
  try {
    res.json({ message: 'Cliente inactivado correctamente.', data: await service.changeStatus(req.params.id, 'INACTIVO') });
  } catch (e) { next(e); }
}
async function reactivate(req, res, next) {
  try {
    res.json({ message: 'Cliente reactivado correctamente.', data: await service.changeStatus(req.params.id, 'ACTIVO') });
  } catch (e) { next(e); }
}
async function addVehicle(req, res, next) {
  try {
    res.status(201).json({ message: 'Vehículo asociado correctamente.', data: await service.addVehicle(req.params.id, req.body || {}) });
  } catch (e) { next(e); }
}

module.exports = { create, list, get, update, inactivate, reactivate, addVehicle };
