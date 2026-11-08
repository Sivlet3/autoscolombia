const router = require('express').Router();
const controller = require('./cell.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/inactivate', controller.inactivate);
router.post('/:id/reactivate', controller.reactivate);
router.post('/:id/assign', controller.assign);
router.post('/:id/release', controller.release);

module.exports = router;
