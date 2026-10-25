const router = require('express').Router();
const controller = require('./vehicle.controller');

router.post('/entry', controller.entry);
router.get('/inside', controller.inside);
router.post('/:id/exit', controller.exit);
router.get('/history', controller.history);

module.exports = router;
