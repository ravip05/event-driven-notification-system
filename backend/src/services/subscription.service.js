const { prisma } = require('../config');

async function subscribe(userId, eventTypeId) {
  try {
    const data = await prisma.subscription.create({ data: { userId, eventTypeId } });
    return { data };
  } catch (e) {
    if (e.code === 'P2002') return { error: 'DUPLICATE', status: 409 };
    if (e.code === 'P2003') return { error: 'NOT_FOUND', status: 404 };
    throw e;
  }
}

async function unsubscribe(id, userId) {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) return { error: 'NOT_FOUND', status: 404 };
  if (sub.userId !== userId) return { error: 'FORBIDDEN', status: 403 };
  await prisma.subscription.delete({ where: { id } });
  return { data: null };
}

async function listMine(userId) {
  return prisma.subscription.findMany({
    where: { userId },
    include: { eventType: true },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { subscribe, unsubscribe, listMine };
