const { prisma } = require('../config');

async function create({ name, description, payloadSchema, createdById }) {
  return prisma.eventType.create({
    data: { name, description, payloadSchema, createdById },
  });
}

async function list() {
  return prisma.eventType.findMany({ orderBy: { createdAt: 'desc' } });
}

async function update(id, userId, data) {
  const et = await prisma.eventType.findUnique({ where: { id } });
  if (!et) return { error: 'NOT_FOUND', status: 404 };
  if (et.createdById !== userId) return { error: 'FORBIDDEN', status: 403 };

  const updated = await prisma.eventType.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.payloadSchema !== undefined && { payloadSchema: data.payloadSchema }),
    },
  });
  return { data: updated };
}

async function remove(id, userId) {
  const et = await prisma.eventType.findUnique({ where: { id } });
  if (!et) return { error: 'NOT_FOUND', status: 404 };
  if (et.createdById !== userId) return { error: 'FORBIDDEN', status: 403 };

  await prisma.eventType.delete({ where: { id } });
  return { data: null };
}

module.exports = { create, list, update, remove };
