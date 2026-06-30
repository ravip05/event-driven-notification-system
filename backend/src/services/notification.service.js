const { prisma } = require('../config');

async function listMine(userId) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      event: {
        include: { eventType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function markRead(id, userId) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return { error: 'NOT_FOUND' };
  if (notification.userId !== userId) return { error: 'FORBIDDEN' };
  if (notification.readAt) return { data: notification }; // already read — idempotent

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return { data: updated };
}

async function markAllRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { data: null };
}

module.exports = { listMine, markRead, markAllRead };
