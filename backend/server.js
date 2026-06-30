require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { PORT } = require('./src/config');

const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────
const { initSocket } = require('./src/socket');
initSocket(server);
// ────────────────────────────────────────────────────────────────────────

// ── BullMQ worker ────────────────────────────────────────────────────────
require('./src/workers/eventWorker');
// ────────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] health → GET http://localhost:${PORT}/api/health`);
});
