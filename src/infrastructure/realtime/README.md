# Realtime transport (v0.3)

TFLives uses a Vercel-compatible hybrid polling transport. Neon PostgreSQL,
accessed exclusively through Prisma, remains the source of truth.

- The open global-chat panel requests only messages after its latest cursor
  every five seconds, and refreshes when the tab becomes visible.
- Open direct/group conversations use the same cursor-based incremental fetch.
- Notification, global-chat unread, and inbox badges use slower background
  refreshes (10–30 seconds) plus a visibility refresh.
- Initial history is cursor-paginated (maximum 50 messages), so reconnects do
  not load a full conversation history.
- When a poll fails, the UI shows a degraded state. Sending remains a normal
  authenticated HTTP mutation; failed global sends retain a retry payload and
  successful writes are idempotently merged by database id on the client.

This avoids fragile persistent WebSockets in Vercel serverless functions while
keeping the domain independent of any future managed transport (Ably/Pusher,
for example). No new realtime environment variables are required for v0.3.

Limits: delivery is near-realtime rather than instant, and a recipient can wait
up to the active poll interval for a new message. A managed pub/sub transport
can later publish the same database-backed events without changing persistence
or authorization rules.
