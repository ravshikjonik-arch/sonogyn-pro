-- Геймификация «Звёзды и награды» (Prisma @@map tables)
-- user_id = auth.users.id (Supabase UUID)

CREATE TABLE IF NOT EXISTS prisma_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  module_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prisma_user_achievements (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES prisma_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_prisma_user_achievements_user ON prisma_user_achievements(user_id);

CREATE TABLE IF NOT EXISTS prisma_user_progress (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  iota_correct_streak INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prisma_quiz_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  passed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_prisma_quiz_results_user_module ON prisma_quiz_results(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_prisma_quiz_results_user_passed ON prisma_quiz_results(user_id, passed_at);

ALTER TABLE prisma_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisma_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisma_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY achievements_select_own ON prisma_user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY progress_select_own ON prisma_user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quiz_select_own ON prisma_quiz_results
  FOR SELECT USING (auth.uid() = user_id);

-- Справочник бейджей (идемпотентно)
INSERT INTO prisma_achievements (id, name, slug, description, icon_emoji, xp_reward, criteria_type, criteria_value, module_id)
VALUES
  ('ach_orads_explorer', 'O-RADS Explorer', 'orads-explorer', 'Пройдено 3 учебных кейса по O-RADS US', '⭐', 50, 'CASES_COMPLETED', 3, 'orads'),
  ('ach_iota_pro', 'IOTA Pro', 'iota-pro', '5 правильных интерпретаций IOTA подряд', '⭐⭐', 75, 'CORRECT_STREAK', 5, 'iota'),
  ('ach_ultrasound_student', 'Ученик УЗИ', 'ultrasound-student', 'Изучено 10 учебных материалов', '⭐', 50, 'LESSONS_COMPLETED', 10, 'general'),
  ('ach_patient_streak', 'Терпеливый', 'patient-streak', '7 дней подряд заходите в платформу', '🔥', 100, 'LOGIN_STREAK', 7, NULL),
  ('ach_fmf_master', 'FMF Мастер', 'fmf-master', '100% прохождение раздела FMF', '🏆', 150, 'MODULE_COMPLETION', 100, 'fmf')
ON CONFLICT (slug) DO NOTHING;
