const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

const router = Router();

router.use(auth);

router.get('/', ctrl.listMine);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
