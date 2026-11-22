const router = require('express').Router();
const controller = require('./payment.controller');

router.get('/config', controller.config);
router.get('/rates', controller.rates);
router.get('/memberships', controller.memberships);
router.get('/memberships/status', controller.membershipStatus);
router.post('/webhook', controller.webhook);                         // la llama la pasarela
router.post('/simulator/:reference/:outcome', controller.simulate);  // solo pasarela simulada
router.get('/by-reference/:reference', controller.byReference);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.post('/:id/sync', controller.sync);
router.post('/:id/cancel', controller.cancel);

module.exports = router;
