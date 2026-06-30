const { Worker } = require('bullmq');
const { prisma } = require('../config');
const { connection } = require('../queues');
const JOB_TYPES = require('../queues/jobTypes');

// ── Dead-letter helper ────────────────────────────────────────────────────────
// Marks all pending notifications for an event as failed and logs to the
// dead-letter store (console; extend to a DB table or separate queue as needed).
async function deadLetter(eventId, jobId, error) {
  console.error('[DeadLetter] Permanently failed job', { jobId, eventId, error: error.message });
  await prisma.notification.updateMany({
    where: { eventId, status: 'pending' },
    data: { status: 'failed' },
  });
  emitLog(`[Job ${jobId}] ❌ Dead-lettered. Exhausted retries.`);
}

function emitLog(msg) {
  try {
    const { getIo } = require('../socket');
    getIo().emit('system:log', msg);
  } catch (err) {}
}

// ── Dispatch one notification ─────────────────────────────────────────────────
async function dispatchNotification(notification, simulateFailure, attempt) {
  if (simulateFailure && attempt < 3) {
    throw new Error(`Simulated network failure on attempt ${attempt}`);
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      status: 'sent',
      dispatchedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  try {
    const { getIo } = require('../socket');
    const full = await prisma.notification.findUnique({
      where: { id: notification.id },
      include: { 
        event: { include: { eventType: true } },
        user: true 
      },
    });
    getIo().to(`user:${notification.userId}`).emit('notification:new', {
      id: full.id,
      status: full.status,
      createdAt: full.createdAt,
      event: { payload: full.event.payload, triggeredAt: full.event.triggeredAt },
      eventType: { name: full.event.eventType.name },
    });
    emitLog(`[Dispatch] 📨 Sent to user '${full.user.name}'`);
  } catch {
    // socket layer not critical — dispatch already succeeded
  }
}

// ── Job processor ─────────────────────────────────────────────────────────────
async function processJob(job) {
  const { eventId } = job.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventType: {
        include: { subscriptions: true },
      },
    },
  });

  if (!event) throw new Error(`Event ${eventId} not found`);

  const subscriptions = event.eventType.subscriptions;
  if (subscriptions.length === 0) {
    console.log(`[Worker] No subscribers for event ${eventId} — nothing to dispatch`);
    emitLog(`[Job ${job.id}] ℹ️ No subscribers for event ${eventId} - skipping.`);
    return;
  }

  const simulateFailure = job.data.simulateFailure === true;
  const attempt = job.attemptsMade + 1;
  
  if (attempt === 1) emitLog(`[Job ${job.id}] ⚙️ Worker processing job (Event: ${event.eventType.name})`);
  else emitLog(`[Job ${job.id}] ⚙️ Worker retrying job (Attempt ${attempt})`);

  // Create pending Notification rows idempotently (safe on retry).
  const notifications = await Promise.all(
    subscriptions.map(async (sub) => {
      const existing = await prisma.notification.findFirst({
        where: { eventId, userId: sub.userId },
      });
      if (existing) return existing;
      return prisma.notification.create({
        data: { eventId, userId: sub.userId, status: 'pending' },
      });
    })
  );

  // IDEMPOTENCY FIX: Filter out already 'sent' notifications
  const pendingNotifications = notifications.filter(n => n.status === 'pending' || n.status === 'failed');

  if (pendingNotifications.length === 0) {
    emitLog(`[Job ${job.id}] 📢 All notifications already dispatched. Skipping.`);
    return;
  }

  emitLog(`[Job ${job.id}] 📢 Fan-out: Found ${pendingNotifications.length} pending subscribers`);

  // Dispatch each notification. Any throw here causes BullMQ to retry the job.
  await Promise.all(pendingNotifications.map((n) => dispatchNotification(n, simulateFailure, attempt)));

  emitLog(`[Job ${job.id}] ✅ Job completed successfully!`);
  console.log(`[Worker] Dispatched ${pendingNotifications.length} notification(s) for event ${eventId}`);
}

// ── Worker instance ───────────────────────────────────────────────────────────
const worker = new Worker('eventQueue', processJob, {
  connection: connection.duplicate(),
  concurrency: 5,
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', async (job, error) => {
  const exhausted = job.attemptsMade >= (job.opts.attempts ?? 3);
  console.error(`[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}):`, error.message);
  emitLog(`[Job ${job.id}] ⚠️ Failed on attempt ${job.attemptsMade}: ${error.message}`);
  if (exhausted) {
    await deadLetter(job.data.eventId, job.id, error);
  }
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

console.log('[Worker] eventWorker started — consuming eventQueue');

module.exports = worker;
