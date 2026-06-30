const { prisma } = require('../config');
const { eventQueue } = require('../queues');
const JOB_TYPES = require('../queues/jobTypes');

// AJV v8 exports as an ES module default; handle both CJS wrapper shapes.
const _Ajv = require('ajv');
const Ajv = _Ajv.default || _Ajv;
const ajv = new Ajv({ strict: false, allErrors: true });

async function trigger(eventTypeId, payload, userId, simulateFailure = false) {
  const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType) return { error: 'NOT_FOUND' };

  // Validate payload against the stored JSON Schema.
  let validate;
  try {
    validate = ajv.compile(eventType.payloadSchema);
  } catch (e) {
    return { error: 'SCHEMA_ERROR', message: `EventType has an invalid payloadSchema: ${e.message}` };
  }

  if (!validate(payload)) {
    return {
      error: 'VALIDATION_ERROR',
      message: 'Payload does not match the event type schema',
      details: validate.errors,
    };
  }

  const event = await prisma.event.create({
    data: { eventTypeId, payload, triggeredById: userId },
  });

  await eventQueue.add(JOB_TYPES.DISPATCH_EVENT, {
    eventId: event.id,
    simulateFailure: !!simulateFailure,
  });

  return { data: event };
}

module.exports = { trigger };

