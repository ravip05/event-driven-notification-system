const svc = require('../services/subscription.service');

async function listMine(req, res) {
  try {
    const data = await svc.listMine(req.user.id);
    res.json({ data });
  } catch (err) {
    console.error('[subscription.listMine]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function subscribe(req, res) {
  try {
    const { eventTypeId } = req.body;
    if (!eventTypeId) {
      return res.status(400).json({ error: { message: 'eventTypeId is required', code: 'VALIDATION_ERROR' } });
    }
    const result = await svc.subscribe(req.user.id, eventTypeId);
    if (result.error === 'DUPLICATE') return res.status(409).json({ error: { message: 'Already subscribed to this event type', code: 'DUPLICATE' } });
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: { message: 'Event type not found', code: 'NOT_FOUND' } });
    res.status(201).json({ data: result.data });
  } catch (err) {
    console.error('[subscription.subscribe]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function unsubscribe(req, res) {
  try {
    const result = await svc.unsubscribe(req.params.id, req.user.id);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: { message: 'Subscription not found', code: 'NOT_FOUND' } });
    if (result.error === 'FORBIDDEN') return res.status(403).json({ error: { message: 'Not your subscription', code: 'FORBIDDEN' } });
    res.status(204).send();
  } catch (err) {
    console.error('[subscription.unsubscribe]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

module.exports = { listMine, subscribe, unsubscribe };

