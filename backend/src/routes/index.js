const { Router } = require('express');

const router = Router();

// Health check — always available, no auth required
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Feature routers registered below ──────────────────────────────────────
const authRouter = require('./auth.routes');         router.use('/api/auth', authRouter);
const eventTypesRouter = require('./eventType.routes');    router.use('/api/event-types', eventTypesRouter);
const subscriptionsRouter = require('./subscription.routes'); router.use('/api/subscriptions', subscriptionsRouter);
const notificationsRouter = require('./notification.routes'); router.use('/api/notifications', notificationsRouter);
// ──────────────────────────────────────────────────────────────────────────

module.exports = router;
