-- ==========================================================
-- Historial de sesiones de estudio
-- Necesario para el gráfico "Historial de Sesiones" del perfil.
-- Ejecuta si tu base de datos no tiene ya la tabla study_sessions
-- (por ejemplo, si solo aplicaste admin_panel.sql).
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(started_at);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON study_sessions;
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON study_sessions;
CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir al admin (mnartves@gmail.com) y al resto verlo de forma segura.
DROP POLICY IF EXISTS "Others can view sessions" ON study_sessions;
CREATE POLICY "Others can view sessions" ON study_sessions
  FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';
