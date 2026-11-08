const service = require('./cell.service');

async function list(req, res, next) {
  try { res.json({ data: await service.list(req.query) }); } catch (e) { next(e); }
}
async function create(req, res, next) {
  try {
    res.status(201).json({ message: 'Celda creada correctamente.', data: await service.create(req.body || {}) });
  } catch (e) { next(e); }
}
async function update(req, res, next) {
  try {
    res.json({ message: 'Celda actualizada correctamente.', data: await service.update(req.params.id, req.body || {}) });
  } catch (e) { next(e); }
}
async function inactivate(req, res, next) {
  try { res.json({ message: 'Celda inactivada correctamente.', data: await service.inactivate(req.params.id) }); } catch (e) { next(e); }
}
async function reactivate(req, res, next) {
  try { res.json({ message: 'Celda reactivada correctamente.', data: await service.reactivate(req.params.id) }); } catch (e) { next(e); }
}
async function assign(req, res, next) {
  try {
    res.json({ message: 'Celda asignada correctamente.', data: await service.assign(req.params.id, req.body || {}) });
  } catch (e) { next(e); }
}
async function release(req, res, next) {
  try { res.json({ message: 'Celda liberada correctamente.', data: await service.release(req.params.id) }); } catch (e) { next(e); }
}

module.exports = { list, create, update, inactivate, reactivate, assign, release };
