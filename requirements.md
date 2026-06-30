# Requirements Document
## Assignment 2: Event-Driven Notification & Subscription Platform

---

## 1. Problem Statement

Build a full-stack platform where users can subscribe to event types and receive real-time
notifications when those events are triggered. Events are defined and fired via UI or API.
The system must handle async dispatch, failure, and retry reliably.

---

## 2. Architecture Decision

**Chosen Approach: Modular Monolith + BullMQ (Redis) + WebSockets**

Single deployable application internally separated into three layers:
- **API Layer** — handles all HTTP requests
- **Worker Layer** — consumes jobs from Redis queue, dispatches notifications
- **WebSocket Layer** — pushes real-time notification delivery to connected clients

Event flow:
```
Client triggers event
    → API writes Event record to DB
    → Pushes job to BullMQ queue (Redis)
    → Returns 202 Accepted immediately

BullMQ Worker picks up job
    → Queries subscribers from DB
    → Creates one notification job per subscriber
    → Dispatches notification
        → Updates notification status (sent / failed)
        → Emits via WebSocket to online subscribers
    → On failure: auto-retry with exponential backoff (max 3 attempts)
    → After 3 failures: marks as failed, logs to Dead Letter store
```

**Why this approach:**
- Satisfies the mandatory retry + failure handling requirement with zero custom code (BullMQ handles it)
- Architecture diagram tells a clear story: HTTP → Queue → Worker → WS
- WebSocket makes the demo visually compelling (live notification popups)
- Fully buildable in 5 days as a solo developer
- One optional feature (WebSocket) executed cleanly rather than several done poorly

---

## 3. Actors

| Actor | Description |
|---|---|
| **Authenticated User** | Registers, subscribes to events, triggers events, views notifications |
| **System / Worker** | Processes event jobs, dispatches notifications, handles retries |

> No admin role required. Any authenticated user can create and trigger event types.

---

## 4. Functional Requirements

### 4.1 User Management (Mandatory)
- User can register with name, email, password
- User can log in and receive a JWT
- All non-auth endpoints require a valid JWT
- Password stored as bcrypt hash

### 4.2 Event Type Management (Mandatory)
- Authenticated user can **create** an event type with:
  - `name` (e.g., `order.created`)
  - `description`
  - `payload_schema` (JSON — defines what fields the event payload carries)
- Authenticated user can **update** and **delete** their event types
- Any authenticated user can **view** all event types (to subscribe to them)

### 4.3 Event Triggering (Mandatory)
- Authenticated user can **trigger** an event type by providing a payload
- System validates payload against the event type's `payload_schema`
- Trigger is available via both:
  - UI button on the event type detail page
  - `POST /event-types/:id/trigger` API endpoint
- API responds with `202 Accepted` immediately (async processing)

### 4.4 Subscription System (Mandatory)
- Authenticated user can **subscribe** to any event type
- Authenticated user can **unsubscribe** from an event type
- User can view their active subscriptions
- Duplicate subscriptions for the same user + event type are rejected

### 4.5 Notification Dispatch (Mandatory)
- On event trigger, system identifies all subscribers of that event type
- Creates one `Notification` record per subscriber (status: `pending`)
- Worker dispatches each notification:
  - Updates status to `sent` on success
  - Updates status to `failed` after all retries exhausted
- If user is connected via WebSocket at time of dispatch, notification is pushed live
- If user is offline, notification sits in history for retrieval on next login

### 4.6 Notification History (Mandatory)
- Authenticated user can fetch their full notification history
- Each record shows: event name, payload, timestamp, status (sent / failed), read status
- User can mark a notification as **read**

### 4.7 Failure Handling & Retry (Mandatory)
- BullMQ handles retries automatically
- Retry config: **3 attempts**, **exponential backoff** (1s → 5s → 30s)
- After 3 failures: notification status set to `failed`, job moved to dead letter log
- Failed jobs are visible in notification history with `failed` status

### 4.8 Real-Time Notifications via WebSocket (Chosen Optional Feature)
- On login, client establishes a WebSocket connection (Socket.io)
- Connection is authenticated via JWT handshake
- When worker dispatches a notification for a user who is currently connected:
  - Emits a `notification:new` event to that user's socket room
  - Frontend displays a toast/popup immediately
- On disconnect, no data is lost — notification is already persisted in DB

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | JWT auth on all protected routes, bcrypt password hashing |
| **Reliability** | Retry with exponential backoff, dead letter logging |
| **Responsiveness** | Event trigger endpoint returns within 200ms (async dispatch) |
| **Code Quality** | Modular folder structure, no business logic in route handlers |
| **API Design** | RESTful, consistent error responses with status codes and messages |

---

## 6. Data Model

### Users
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | |
| email | String | Unique |
| password_hash | String | bcrypt |
| created_at | Timestamp | |

### EventTypes
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | e.g. `order.created`, unique |
| description | String | |
| payload_schema | JSONB | Defines expected payload fields |
| created_by | UUID | FK → Users |
| created_at | Timestamp | |

### Events (fired instances)
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| event_type_id | UUID | FK → EventTypes |
| payload | JSONB | Actual data sent with this trigger |
| triggered_by | UUID | FK → Users |
| triggered_at | Timestamp | |

### Subscriptions
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → Users |
| event_type_id | UUID | FK → EventTypes |
| created_at | Timestamp | |
| UNIQUE | | (user_id, event_type_id) |

### Notifications
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| event_id | UUID | FK → Events |
| user_id | UUID | FK → Users (the subscriber) |
| status | Enum | `pending`, `sent`, `failed` |
| attempts | Integer | How many dispatch attempts made |
| read_at | Timestamp | Null if unread |
| dispatched_at | Timestamp | When successfully sent |
| created_at | Timestamp | |

---

## 7. API Design

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |

### Event Types
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/event-types` | Yes | List all event types |
| POST | `/api/event-types` | Yes | Create an event type |
| PUT | `/api/event-types/:id` | Yes | Update an event type |
| DELETE | `/api/event-types/:id` | Yes | Delete an event type |
| POST | `/api/event-types/:id/trigger` | Yes | Fire an event |

### Subscriptions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/subscriptions` | Yes | Get current user's subscriptions |
| POST | `/api/subscriptions` | Yes | Subscribe to an event type |
| DELETE | `/api/subscriptions/:id` | Yes | Unsubscribe |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Yes | Get current user's notification history |
| PATCH | `/api/notifications/:id/read` | Yes | Mark notification as read |

### WebSocket Events
| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | Establish socket, authenticate via JWT |
| `notification:new` | Server → Client | Push new notification to connected user |

---

## 8. Folder Structure (Planned)

```
/backend
  /src
    /routes         — Express route definitions
    /controllers    — Request/response handling only
    /services       — Business logic (event, subscription, notification)
    /workers        — BullMQ job processors
    /queues         — Queue and job type definitions
    /models         — DB schema (Prisma or Sequelize)
    /middleware     — JWT auth, error handler
    /socket         — Socket.io setup and room management
  server.js

/frontend
  /src
    /pages          — Register, Login, Dashboard, EventTypes, Notifications
    /components     — NotificationToast, EventCard, SubscriptionToggle
    /hooks          — useNotifications, useSocket
    /api            — Axios client functions
  App.jsx
```

---

## 9. Out of Scope

- Email / webhook notification channels
- Admin roles or role-based access control
- Message queue infrastructure (Kafka, RabbitMQ) — BullMQ over Redis is sufficient
- Notification batching
- Multi-dataset or multi-tenant support
- Password reset flow

---

## 10. Open Questions & Assumptions Made

| Question | Assumption |
|---|---|
| Who can create event types? | Any authenticated user |
| Who can trigger an event? | Any authenticated user (not just the creator) |
| Is payload schema strictly validated? | Yes — reject trigger if payload doesn't match schema |
| What counts as dispatch success? | Notification record written to DB + WebSocket emit attempted |
| What is the retry window? | 3 attempts, exponential backoff via BullMQ config |
| Can a user subscribe to their own event types? | Yes |
