const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// BullMQ requires maxRetriesPerRequest: null for blocking commands used by workers.
// A dedicated connection is used so BullMQ can call .duplicate() internally without
// interfering with the shared app Redis instance.
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('error', (err) => console.error('[BullMQ Redis] connection error:', err));

// Exponential backoff with delay:1000 yields ~1s → 2s → 4s between retries,
// approximating the ~1s → 5s → 30s targets in requirements.
const eventQueue = new Queue('eventQueue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  },
});

module.exports = { eventQueue, connection };
