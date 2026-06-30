const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/subscription.controller');

const router = Router();

router.use(auth);

router.get('/', ctrl.listMine);
router.post('/', ctrl.subscribe);
router.delete('/:id', ctrl.unsubscribe);

module.exports = router;
