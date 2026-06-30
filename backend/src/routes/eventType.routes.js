const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/eventType.controller');

const router = Router();

router.use(auth);

router.get('/', ctrl.listAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/trigger', ctrl.trigger);

module.exports = router;
