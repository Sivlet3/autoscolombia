const service = require('./vehicle.service');

async function entry(req, res, next) {
  try {
    const result = await service.registerEntry(req.body || {});
    res.status(201).json({ message: 'Entrada registrada correctamente.', data: result });
  } catch (e) { next(e); }
}
async function inside(req, res, next) {
  try { res.json({ data: await service.listInside() }); } catch (e) { next(e); }
}
async function exit(req, res, next) {
  try {
    const result = await service.registerExit(req.params.id, req.body?.notes);
    res.json({ message: 'Salida registrada correctamente.', data: result });
  } catch (e) { next(e); }
}
async function history(req, res, next) {
  try { res.json({ data: await service.history(req.query.plate) }); } catch (e) { next(e); }
}
module.exports = { entry, inside, exit, history };
