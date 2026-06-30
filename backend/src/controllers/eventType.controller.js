const svc = require('../services/eventType.service');
const eventSvc = require('../services/event.service');

async function listAll(req, res) {
  try {
    const data = await svc.list();
    res.json({ data });
  } catch (err) {
    console.error('[eventType.listAll]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function create(req, res) {
  try {
    const { name, description, payloadSchema } = req.body;
    if (!name || payloadSchema === undefined) {
      return res.status(400).json({ error: { message: 'name and payloadSchema are required', code: 'VALIDATION_ERROR' } });
    }
    const data = await svc.create({ name, description, payloadSchema, createdById: req.user.id });
    res.status(201).json({ data });
  } catch (err) {
    console.error('[eventType.create]', err);
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'Event type name already exists', code: 'DUPLICATE' } });
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function update(req, res) {
  try {
    const result = await svc.update(req.params.id, req.user.id, req.body);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: { message: 'Event type not found', code: 'NOT_FOUND' } });
    if (result.error === 'FORBIDDEN') return res.status(403).json({ error: { message: 'Only the owner can update this event type', code: 'FORBIDDEN' } });
    res.json({ data: result.data });
  } catch (err) {
    console.error('[eventType.update]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function remove(req, res) {
  try {
    const result = await svc.remove(req.params.id, req.user.id);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: { message: 'Event type not found', code: 'NOT_FOUND' } });
    if (result.error === 'FORBIDDEN') return res.status(403).json({ error: { message: 'Only the owner can delete this event type', code: 'FORBIDDEN' } });
    res.status(204).send();
  } catch (err) {
    console.error('[eventType.remove]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function trigger(req, res) {
  try {
    const { payload, simulateFailure } = req.body;
    if (payload === undefined) {
      return res.status(400).json({ error: { message: 'payload is required', code: 'VALIDATION_ERROR' } });
    }
    const result = await eventSvc.trigger(req.params.id, payload, req.user.id, simulateFailure);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: { message: 'Event type not found', code: 'NOT_FOUND' } });
    if (result.error === 'SCHEMA_ERROR') return res.status(422).json({ error: { message: result.message, code: 'SCHEMA_ERROR' } });
    if (result.error === 'VALIDATION_ERROR') return res.status(400).json({ error: { message: result.message, code: 'VALIDATION_ERROR', details: result.details } });
    res.status(202).json({ data: result.data });
  } catch (err) {
    console.error('[eventType.trigger]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

module.exports = { listAll, create, update, remove, trigger };

