# NotifyHub: Event-Driven Notification & Subscription Platform

A full-stack, real-time notification platform built with **Node.js, Express, React, PostgreSQL, BullMQ, and Socket.io**. Users can subscribe to specific event types and receive real-time notifications via WebSockets when those events are triggered.

---

## 🏗️ Project Structure

The repository is structured as a modular monolith containing both the frontend and backend applications:

```text
.
├── backend/                  # Node.js REST API & Background Worker
│   ├── prisma/               # Database schema (schema.prisma) & migrations
│   ├── src/
│   │   ├── config/           # Environment variables, Prisma, and Redis setup
│   │   ├── controllers/      # Express route controllers (auth, events, etc.)
│   │   ├── middleware/       # JWT auth & centralized error handling
│   │   ├── queues/           # BullMQ configuration
│   │   ├── routes/           # Express API route definitions
│   │   ├── services/         # Core business logic
│   │   ├── socket/           # Socket.io WebSocket server configuration
│   │   └── workers/          # BullMQ background job processors
│   └── server.js             # API Server entry point
│
├── frontend/                 # React UI Application (Vite)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── api/              # Axios HTTP client and endpoint definitions
│   │   ├── components/       # Reusable React components (Layout, Toasts, etc.)
│   │   ├── context/          # React Context (Auth)
│   │   ├── hooks/            # Custom hooks (useSocket, useNotifications)
│   │   └── pages/            # Application views (Dashboard, Login, Register)
│   ├── index.html            # Main HTML template
│   └── vite.config.js        # Vite configuration
│
└── docker-compose.yml        # Infrastructure setup (PostgreSQL & Redis)
```

---

## 🚀 Setup & Run Instructions

Follow these steps to get the platform running on your local machine.

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose (for the database and message queue)
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### 1. Start the Infrastructure
The application relies on PostgreSQL for persistent storage and Redis for background job queuing.
```bash
# Run this from the root of the project
docker-compose up -d
```
*Verify both services are running using `docker-compose ps`.*

### 2. Start the Backend Server
The backend runs the Express API, Socket.io server, and BullMQ worker in a single process.
```bash
cd backend

# Install dependencies
npm install

# Apply database migrations and generate the Prisma Client
npm run migrate
npm run generate

# Start the server (runs on http://localhost:3000)
npm run dev
```
*Health check:* You can verify the backend is running by visiting `http://localhost:3000/api/health`.

### 3. Start the Frontend UI
The frontend is a React application served via Vite.
```bash
# Open a new terminal tab/window
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will start at **http://localhost:5174** (or 5173 depending on availability).*

---

## 📐 Architecture Overview

1. **Trigger**: An event is fired via `POST /api/event-types/:id/trigger`. The payload is validated, saved to Postgres, and a job is enqueued in Redis. The API immediately returns a `202 Accepted`.
2. **Fan-out**: The BullMQ Worker dequeues the job in the background, identifies all subscribers, and creates pending Notification records.
3. **Dispatch**: The Worker marks notifications as `sent` and emits a `notification:new` event via WebSocket to specific user rooms.
4. **Delivery**: Online users immediately see a live toast notification. Offline users will see the notification in their history upon next login.

---

## 📚 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register (name, email, password) |
| POST | `/api/auth/login` | No | Login → Returns JWT |
| GET | `/api/event-types` | JWT | List all event types |
| POST | `/api/event-types` | JWT | Create event type |
| PUT | `/api/event-types/:id` | JWT | Update event type (owner only) |
| DELETE | `/api/event-types/:id` | JWT | Delete event type (owner only) |
| POST | `/api/event-types/:id/trigger` | JWT | Fire event (payload validated against JSON schema) |
| GET | `/api/subscriptions` | JWT | List my active subscriptions |
| POST | `/api/subscriptions` | JWT | Subscribe to an event type |
| DELETE | `/api/subscriptions/:id` | JWT | Unsubscribe from an event type |
| GET | `/api/notifications` | JWT | View notification history |
| PATCH | `/api/notifications/:id/read` | JWT | Mark a notification as read |

*WebSocket Endpoint: Connect to `http://localhost:3000` with `{ auth: { token } }`.*

---

## ✅ PRD Success Criteria Verification

| # | Criterion | Status | Implementation Notes |
|---|---|---|---|
| 4.1 | Register with name/email/password | ✅ PASS | `POST /api/auth/register`; bcrypt hash stored |
| 4.1 | Login returns JWT | ✅ PASS | `POST /api/auth/login`; 7-day token |
| 4.1 | All non-auth endpoints require JWT | ✅ PASS | `auth` middleware on all feature routers |
| 4.1 | Password stored as bcrypt hash | ✅ PASS | `bcrypt.hash(password, 10)` |
| 4.2 | Create event type with name, description, payloadSchema | ✅ PASS | Stored as JSONB |
| 4.2 | Update / delete own event types | ✅ PASS | Owner check enforced in service |
| 4.2 | Any user can view all event types | ✅ PASS | `GET /api/event-types` |
| 4.3 | Trigger event with payload validation | ✅ PASS | AJV compiles payloadSchema, rejects mismatches with 400 |
| 4.3 | Trigger via UI and API | ✅ PASS | Button on EventTypePage + REST endpoint |
| 4.3 | Trigger returns 202 Accepted immediately | ✅ PASS | Job enqueued async; response before worker runs |
| 4.4 | Subscribe / unsubscribe | ✅ PASS | `POST /api/subscriptions`, `DELETE /api/subscriptions/:id` |
| 4.4 | View active subscriptions | ✅ PASS | `GET /api/subscriptions` |
| 4.4 | Duplicate subscription rejected | ✅ PASS | Prisma unique constraint → 409 |
| 4.5 | Fan-out: one Notification per subscriber | ✅ PASS | Worker creates rows idempotently per subscriber |
| 4.5 | Status updates: pending → sent / failed | ✅ PASS | Worker marks `sent`; `failed` handler after 3 attempts |
| 4.5 | Online user gets live WebSocket push | ✅ PASS | Worker emits `notification:new` to `user:<id>` room |
| 4.5 | Offline user sees notification in history | ✅ PASS | Notification persisted in DB regardless of socket state |
| 4.6 | Notification history endpoint | ✅ PASS | `GET /api/notifications` with event + eventType included |
| 4.6 | Mark notification as read | ✅ PASS | `PATCH /api/notifications/:id/read` sets `readAt` |
| 4.7 | 3 retry attempts with exponential backoff | ✅ PASS | BullMQ `attempts: 3, backoff: { type: 'exponential', delay: 1000 }` |
| 4.7 | After 3 failures: status = `failed` | ✅ PASS | `deadLetter()` calls `updateMany` on exhausted job |
| 4.7 | Failed jobs visible in notification history | ✅ PASS | `status: failed` returned by history endpoint |
| 4.8 | Socket authenticated via JWT handshake | ✅ PASS | `socket.handshake.auth.token` verified in `io.use()` middleware |
| 4.8 | `notification:new` emitted to correct room | ✅ PASS | Room `user:<id>` joined on connection |
| 4.8 | Frontend toast on live notification | ✅ PASS | `NotificationToast` listens to `notification:new` |
| NFR | Trigger < 200 ms | ✅ PASS | Only DB write + Redis enqueue before 202; no worker wait |
| NFR | No business logic in route handlers | ✅ PASS | Controllers elegantly delegate to services |
