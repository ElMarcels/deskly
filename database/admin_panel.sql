-- ==========================================================
-- Deskly — Panel de Administración (opcional, aplicar a mano)
-- Tablas nuevas + políticas RLS de administrador.
-- El admin se identifica por email: mnartves@gmail.com
-- ==========================================================

-- Eliminamos políticas viejas que podrían chocar al re-ejecutar
-- (solo cuando existe la tabla/procedimiento correspondiente).
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin can view all users" ON users;
  DROP POLICY IF EXISTS "Admin can delete users" ON users;
  DROP POLICY IF EXISTS "Admin can select all messages" ON messages;
  DROP POLICY IF EXISTS "Admin can delete messages" ON messages;
  DROP POLICY IF EXISTS "Admin can select all rooms" ON study_rooms;
  DROP POLICY IF EXISTS "Admin can delete rooms" ON study_rooms;
  DROP POLICY IF EXISTS "Admin can select all room messages" ON study_room_messages;
  DROP POLICY IF EXISTS "Admin can delete room messages" ON study_room_messages;
  DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;
  DROP POLICY IF EXISTS "Everyone can read announcements" ON announcements;
  DROP POLICY IF EXISTS "Admin can manage tickets" ON tickets;
  DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
  DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
  DROP POLICY IF EXISTS "Admin can view all tickets" ON tickets;
  DROP POLICY IF EXISTS "Admin can read all profile activity" ON profiles;
  DROP POLICY IF EXISTS "Everyone can read app settings" ON app_settings;
  DROP POLICY IF EXISTS "Admin can manage app settings" ON app_settings;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ==========================================================
-- 1) Columna 'banned' en profiles (para bloqueo/suspensión)
-- ==========================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMPTZ;

-- ==========================================================
-- 2) Tabla de ANUNCIOS
-- ==========================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 3) Tabla de TICKETS / SOPORTE
-- ==========================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  staff_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 4) Tabla de CONFIGURACIÓN GLOBAL (modo mantenimiento, etc.)
-- ==========================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT ''
);

-- Si no existe la fila de mantenimiento, la creamos apagada.
INSERT INTO app_settings (key, value) VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 5) Políticas de ADMINISTRADOR por tabla
-- ==========================================================
-- users: admin puede leer todos (ya existía) y borrar
CREATE POLICY "Admin can view all users" ON users FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete users" ON users FOR DELETE
  USING (auth.email() = 'mnartves@gmail.com');

-- profiles: admin puede leer todo (ya es público) y borrar
CREATE POLICY "Admin can delete profile" ON profiles FOR DELETE
  USING (auth.email() = 'mnartves@gmail.com');

-- messages: admin puede ver y borrar todos
CREATE POLICY "Admin can select all messages" ON messages FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete messages" ON messages FOR DELETE
  USING (auth.email() = 'mnartves@gmail.com');

-- study_rooms: admin puede ver y borrar todas
CREATE POLICY "Admin can select all rooms" ON study_rooms FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete rooms" ON study_rooms FOR DELETE
  USING (auth.email() = 'mnartves@gmail.com');

-- study_room_messages: admin puede ver y borrar
CREATE POLICY "Admin can select all room messages" ON study_room_messages FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete room messages" ON study_room_messages FOR DELETE
  USING (auth.email() = 'mnartves@gmail.com');

-- habits / habit_logs: admin puede leer para ver actividad
CREATE POLICY "Admin can read all habits" ON habits FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can read all habit logs" ON habit_logs FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');

-- announcements: público puede leer, admin gestiona
CREATE POLICY "Everyone can read announcements" ON announcements FOR SELECT
  USING (true);
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL
  USING (auth.email() = 'mnartves@gmail.com');

-- tickets: usuario crea/ve los suyos, admin ve y gestiona todos
CREATE POLICY "Users can create own tickets" ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all tickets" ON tickets FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can manage tickets" ON tickets FOR UPDATE
  USING (auth.email() = 'mnartves@gmail.com');

-- app_settings: todos leen (para modo mantenimiento), solo admin escribe
CREATE POLICY "Everyone can read app settings" ON app_settings FOR SELECT
  USING (true);
CREATE POLICY "Admin can manage app settings" ON app_settings FOR ALL
  USING (auth.email() = 'mnartves@gmail.com');

-- ==========================================================
-- 6) RLS para las tablas nuevas
-- ==========================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
