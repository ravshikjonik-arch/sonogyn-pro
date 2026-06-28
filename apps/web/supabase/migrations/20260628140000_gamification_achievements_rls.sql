-- RLS for gamification catalog (prisma_achievements was missing policies)

ALTER TABLE public.prisma_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievements_catalog_read ON public.prisma_achievements;
CREATE POLICY achievements_catalog_read ON public.prisma_achievements
  FOR SELECT TO authenticated
  USING (true);

-- Writes only via service_role / Prisma (no client INSERT/UPDATE/DELETE policies)
