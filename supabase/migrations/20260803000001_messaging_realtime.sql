-- Habilita Supabase Realtime sobre DirectMessage y le agrega RLS para que
-- solo los participantes (ACTIVE o PENDING) de una conversación puedan leer
-- sus mensajes vía postgres_changes. Los inserts los hace siempre el backend
-- con la service role (Prisma), así que no hace falta policy de escritura.

alter table public."DirectMessage" enable row level security;

drop policy if exists "Participants can read conversation messages" on public."DirectMessage";
create policy "Participants can read conversation messages"
  on public."DirectMessage"
  for select
  using (
    exists (
      select 1 from public."ConversationParticipant" cp
      where cp."conversationId" = "DirectMessage"."conversationId"
        and cp."userId" = auth.uid()::text
        and cp.status in ('ACTIVE', 'PENDING')
    )
  );

alter publication supabase_realtime add table public."DirectMessage";
