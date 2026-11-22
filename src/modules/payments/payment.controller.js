const service = require('./payment.service');

async function create(req, res, next) {
  try {
    const data = await service.create(req.body || {});
    res.status(201).json({
      message: data.method === 'EFECTIVO'
        ? 'Pago en efectivo registrado correctamente.'
        : 'Pago creado. Continúa en la pasarela para completarlo.',
      data
    });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try { res.json({ data: await service.list(req.query) }); }
  catch (error) { next(error); }
}

async function get(req, res, next) {
  try { res.json({ data: await service.getById(req.params.id) }); }
  catch (error) { next(error); }
}

async function byReference(req, res, next) {
  try { res.json({ data: await service.getByReference(req.params.reference, req.query.transactionId) }); }
  catch (error) { next(error); }
}

async function sync(req, res, next) {
  try {
    res.json({
      message: 'Estado del pago actualizado.',
      data: await service.sync(req.params.id, req.body && req.body.transactionId)
    });
  } catch (error) { next(error); }
}

async function cancel(req, res, next) {
  try {
    res.json({ message: 'Pago anulado correctamente.', data: await service.cancel(req.params.id) });
  } catch (error) { next(error); }
}

// La pasarela espera HTTP 200 cuando recibe el evento
async function webhook(req, res, next) {
  try { res.status(200).json(await service.handleWebhook(req.headers, req.body)); }
  catch (error) { next(error); }
}

async function simulate(req, res, next) {
  try { res.json({ data: await service.simulate(req.params.reference, req.params.outcome) }); }
  catch (error) { next(error); }
}

async function rates(req, res, next) {
  try { res.json({ data: await service.rates() }); } catch (error) { next(error); }
}

async function config(req, res, next) {
  try { res.json({ data: service.config() }); } catch (error) { next(error); }
}

async function membershipStatus(req, res, next) {
  try { res.json({ data: await service.membershipStatus(req.query.plate) }); }
  catch (error) { next(error); }
}

async function memberships(req, res, next) {
  try { res.json({ data: await service.listMemberships(req.query) }); }
  catch (error) { next(error); }
}

module.exports = {
  create, list, get, byReference, sync, cancel, webhook, simulate,
  rates, config, membershipStatus, memberships
};
