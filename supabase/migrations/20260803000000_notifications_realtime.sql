-- Habilita Supabase Realtime sobre la tabla de notificaciones y le agrega RLS
-- para que cada usuario solo reciba (via postgres_changes) sus propias
-- notificaciones. Los inserts/updates los hace siempre el backend con la
-- service role (Prisma), así que no hace falta una policy de escritura.

alter table public."Notification" enable row level security;

drop policy if exists "Users can read their own notifications" on public."Notification";
create policy "Users can read their own notifications"
  on public."Notification"
  for select
  using (auth.uid()::text = "userId");

alter publication supabase_realtime add table public."Notification";
