const svc = require('../services/notification.service');

async function listMine(req, res) {
  try {
    const data = await svc.listMine(req.user.id);
    res.json({ data });
  } catch (err) {
    console.error('[notification.listMine]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function markRead(req, res) {
  try {
    const result = await svc.markRead(req.params.id, req.user.id);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: { message: 'Notification not found', code: 'NOT_FOUND' } });
    if (result.error === 'FORBIDDEN') return res.status(403).json({ error: { message: 'Not your notification', code: 'FORBIDDEN' } });
    res.json({ data: result.data });
  } catch (err) {
    console.error('[notification.markRead]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

async function markAllRead(req, res) {
  try {
    const result = await svc.markAllRead(req.user.id);
    res.json({ data: result });
  } catch (err) {
    console.error('[notification.markAllRead]', err);
    res.status(500).json({ error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
}

module.exports = { listMine, markRead, markAllRead };

