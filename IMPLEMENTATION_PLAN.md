# Implementation Plan — UI/UX Gap Closure

> Status: planning only — no code changed yet.
> Scope: close the gaps between the current frontend and `requirements.md`
> (Event-Driven Notification & Subscription Platform), and make the app
> genuinely user-friendly for a grader.

## Context discovered during review

Two backend facts shape the plan:

- `login()` returns only `{ token }` ([backend/src/services/auth.service.js:40](backend/src/services/auth.service.js))
  and the JWT payload is just `{ id }` — **no name**. So "show the user's name"
  cannot be fixed on the frontend alone; it needs a small backend change.
- `update`/`delete` event types are **owner-only** (`createdById` check in
  [backend/src/services/eventType.service.js:13-36](backend/src/services/eventType.service.js)),
  so the UI must gate those controls by ownership.

The `PUT /event-types/:id` route, `updateEventType()` API client, and
`listMine()` (subscriptions with nested `eventType`) already exist — those gaps
are UI-only.

---

## Group A — Mandatory requirement gaps

### A1. Edit / Update Event Type (req 4.2)
**Backend:** none — endpoint and `updateEventType()` API client already exist.
**Frontend:**
- New component `frontend/src/components/EditEventTypeForm.jsx`, modeled on
  [CreateEventTypeForm.jsx](frontend/src/components/CreateEventTypeForm.jsx),
  pre-filled with `name`, `description`, and
  `JSON.stringify(payloadSchema, null, 2)`. Reuse the JSON parse/validate logic.
- Mutation calls `updateEventType(id, {...})`, then `invalidateQueries(['eventTypes'])`.
- Surface as an **"Edit"** button on
  [EventTypePage.jsx](frontend/src/pages/EventTypePage.jsx) (info card, next to
  the subscription toggle), toggling the card into edit mode. Detail page over
  the dashboard card to keep the list uncluttered.
- **Ownership gating:** only render Edit/Delete when
  `eventType.createdById === currentUserId` (see C4). Non-owners get 403 anyway;
  hiding the control is the UX fix.

### A2. "My Subscriptions" view (req 4.4)
**Backend:** none — `listMine()` returns subscriptions with `include: { eventType: true }`.
**Frontend:**
- New page `frontend/src/pages/SubscriptionsPage.jsx`; route `/subscriptions` in
  [App.jsx](frontend/src/App.jsx) under `ProtectedRoute`.
- Lists each subscription: event type name (link to `/event-types/:id`),
  description, subscribed-at date, and an inline `SubscriptionToggle` (reused) to
  unsubscribe. Empty state mirroring the dashboard's pattern.
- Add a **"Subscriptions"** nav link to the headers — via the shared layout (C1).

### A3. Show payload schema on trigger page + schema-driven form (req 4.3)
Biggest UX win. **Chosen approach: auto-generate fields from the schema.**
**Backend:** none — `payloadSchema` is already returned on every event type.
**Frontend — new component `frontend/src/components/SchemaForm.jsx`:**
- Input: a JSON-Schema object (`{ type, properties, required }`).
- Renders one labeled input per `properties` key:
  - `string` → text input; `number`/`integer` → number input; `boolean` →
    checkbox; `enum` → `<select>`; nested `object`/`array`/unknown → small JSON
    textarea for that field.
  - Mark `required` fields with `*`; block submit until filled.
- Output: assembles a typed payload object (coerce number/boolean), passed to
  `triggerEventType(id, payload)`.
- **Fallback:** if `payloadSchema` is missing/empty or not an object schema,
  render the existing raw-JSON textarea so nothing breaks.
**Refactor [EventTypePage.jsx](frontend/src/pages/EventTypePage.jsx):**
- Replace the raw textarea block (lines 102–133) with `<SchemaForm>`.
- Add a collapsible **"Expected payload"** panel showing the pretty-printed schema.
- Remove the silent `{ value: raw }` coercion in `parsePayload` (lines 9–17),
  replaced by typed assembly. Keep a "raw JSON" escape-hatch toggle for power
  users (see decision D2).

## Group B — UX dead-ends

### B1. Delete confirmation
- Add a confirm step to the Delete buttons in
  [EventCard.jsx:38](frontend/src/components/EventCard.jsx) and EventTypePage.
  Inline "Delete? Yes / Cancel" two-step state (no dependency, polished feel).

### B2. Mark-all-as-read
- Add a "Mark all read" button in
  [NotificationsPage.jsx](frontend/src/pages/NotificationsPage.jsx) header (shown
  when `unreadCount > 0`). See decision D1 for implementation.

### B3. Readable notification payloads
- In [NotificationsPage.jsx:99-103](frontend/src/pages/NotificationsPage.jsx) and
  [NotificationToast.jsx:38-42](frontend/src/components/NotificationToast.jsx),
  render the payload as pretty key→value rows instead of a truncated
  `JSON.stringify`. Add expand/collapse for long payloads.

## Group C — Visual polish & consistency

### C1. Shared `Layout`/`Header` component
- New `frontend/src/components/Layout.jsx` with one header: brand, live
  indicator, nav links (Dashboard · Subscriptions · Notifications with unread
  badge · user name · Log out).
- Refactor Dashboard, Notifications, EventTypePage, and the new Subscriptions
  page to wrap content in `<Layout>`. Removes duplicated, inconsistent headers
  (`border-b` vs `shadow-sm`) and fixes missing nav links.

### C2. Design-token consistency
- Standardize radii (`rounded-lg`/`rounded-xl`) — fix `SubscriptionToggle`'s
  sharp `rounded` ([lines 22, 33](frontend/src/components/SubscriptionToggle.jsx)).
- Replace emoji branding (🔔/⚡) with a simple inline SVG icon.
- Make headers wrap/responsive for mobile (`flex-wrap`, smaller `sm:` gaps).

### C3. Show the logged-in user's name (needs a small backend change)
**Root cause:** login returns only `{ token }`; JWT carries only `{ id }`.
- Change `login()` in
  [backend/src/services/auth.service.js:39-40](backend/src/services/auth.service.js)
  to also return the user: `return { token, user: { id, name, email } }`.
- `storeLogin(data.token, data.user)` in
  [LoginPage.jsx](frontend/src/pages/LoginPage.jsx) /
  [RegisterPage.jsx](frontend/src/pages/RegisterPage.jsx).
- Persist the user object in
  [AuthContext.jsx](frontend/src/context/AuthContext.jsx) (currently only `token`
  persists, so `user` is null after reload).

### C4. Ownership gating data
- To hide Edit/Delete from non-owners (A1), the frontend needs the current user
  id. With C3's persisted `user.id`, compare against `eventType.createdById`.

---

## Open decisions — recommended approaches

### D1. Mark-all-as-read: frontend loop vs. new endpoint
**Recommendation: add a `PATCH /api/notifications/read-all` endpoint.**
A frontend `Promise.all` loop over each unread id works with zero backend
changes, but it fires N requests, races against new arrivals, and partially
fails messily. A single endpoint is one DB `updateMany`, is atomic, and reads as
intentional API design — which the rubric rewards ("RESTful, consistent error
responses"). The cost is ~10 lines across route/controller/service mirroring the
existing `markRead` path. Worth it.

### D2. Schema-driven trigger form: keep a raw-JSON escape hatch?
**Recommendation: keep both — generated form by default, with a "Raw JSON"
toggle.** The generated form is the user-friendly default (chosen approach), but
a toggle to drop into a raw JSON editor costs almost nothing and covers schemas
the generator can't render cleanly (deeply nested objects, arrays of objects).
It also demonstrates the strict server-side validation still works. Default to
the generated view so the happy path is effortless.

### D3. User identity: modify backend `login` vs. decode JWT on the frontend
**Recommendation: modify the backend `login` response (and persist the user).**
Decoding the JWT is frontend-only but the token holds just `{ id }` — no name —
so it can power ownership checks (C4) but never the header display name. Since we
need the name anyway, returning `{ token, user }` from `login` is the clean fix:
one line in the service, and it makes both the header (C3) and ownership gating
(C4) work from one source of truth.

---

## Suggested order & effort

1. **C3 + C4 + D3** — auth returns user, persist, ownership id. Unblocks A1
   gating and fixes the empty header. *Small.*
2. **A3 + D2** — schema-driven trigger form with raw-JSON toggle. Biggest UX win.
   *Medium.*
3. **A1** (edit) and **A2** (subscriptions view) — close mandatory gaps. *Medium.*
4. **B1–B3 + D1** — UX dead-ends, incl. `read-all` endpoint. *Small.*
5. **C1–C2** — shared layout + visual polish. *Small–Medium.*

## Priority summary

| Gap | Requirement | Severity |
|---|---|---|
| A1 Edit event type | 4.2 (mandatory) | 🔴 fails rubric |
| A2 My Subscriptions view | 4.4 (mandatory) | 🔴 fails rubric |
| A3 Show schema / schema-driven trigger | 4.3 (mandatory UX) | 🔴 fails rubric |
| B1 Delete confirmation | — | 🟠 UX |
| B2 Mark-all-as-read | — | 🟠 UX |
| B3 Readable payloads | 4.6 | 🟠 UX |
| C3 Show user name | — | 🟠 looks logged-out |
| C1 Shared layout / nav | 5 (code quality) | 🟡 polish |
| C2 Design consistency | — | 🟡 polish |
