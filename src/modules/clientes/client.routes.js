const router = require('express').Router();
const controller = require('./client.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.post('/:id/inactivate', controller.inactivate);
router.post('/:id/reactivate', controller.reactivate);
router.post('/:id/vehicles', controller.addVehicle);

module.exports = router;
