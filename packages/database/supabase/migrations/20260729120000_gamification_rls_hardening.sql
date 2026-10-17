-- Gamification catalog: RLS read-only for clients; writes via Prisma/service role only.

alter table public.prisma_achievements enable row level security;

drop policy if exists prisma_achievements_select on public.prisma_achievements;
create policy prisma_achievements_select on public.prisma_achievements
  for select
  using (true);

revoke insert, update, delete on public.prisma_achievements from anon, authenticated;

-- User tables: deny client writes (Prisma / service role only).
revoke insert, update, delete on public.prisma_user_achievements from anon, authenticated;
revoke insert, update, delete on public.prisma_user_progress from anon, authenticated;
revoke insert, update, delete on public.prisma_quiz_results from anon, authenticated;
