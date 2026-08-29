-- ==========================================================
-- Deskly — ESQUEMA COMPLETO (RESET TOTAL)
-- Borra todas las tablas y las recrea desde cero.
-- ==========================================================

DROP TABLE IF EXISTS schedule_slots CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS flashcard_decks CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS routine_items CASCADE;
DROP TABLE IF EXISTS routines CASCADE;
DROP TABLE IF EXISTS study_room_messages CASCADE;
DROP TABLE IF EXISTS study_room_participants CASCADE;
DROP TABLE IF EXISTS study_rooms CASCADE;
DROP TABLE IF EXISTS message_group_members CASCADE;
DROP TABLE IF EXISTS message_groups CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================================
-- CORE TABLES
-- ==========================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT,
  daily_study_goal INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', '')) || '_' || SUBSTRING(NEW.id::text, 1, 6),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#a855f7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Sin título',
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- SOCIAL TABLES
-- ==========================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  banner_url TEXT,
  status TEXT DEFAULT '',
  status_emoji TEXT DEFAULT '📚',
  status_subject TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  pomodoros_total INTEGER DEFAULT 0,
  hours_total FLOAT DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  banned BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  suspension_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('status', 'profile', 'message')),
  target_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_group_members (
  group_id UUID NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ==========================================================
-- STUDY ROOMS
-- ==========================================================

CREATE TABLE study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  is_silent BOOLEAN DEFAULT FALSE,
  max_participants INTEGER DEFAULT 10,
  timer_duration INTEGER DEFAULT 25,
  status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'completed', 'paused')),
  current_timer_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_room_participants (
  room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE study_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROUTINES & HABITS
-- ==========================================================

CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  label TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✓',
  color TEXT DEFAULT '#a855f7',
  target_frequency TEXT DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT DEFAULT '',
  UNIQUE(habit_id, completed_date)
);

-- ==========================================================
-- FLASHCARDS
-- ==========================================================

CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  next_review DATE DEFAULT CURRENT_DATE,
  review_count INTEGER DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- SCHEDULE
-- ==========================================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Horario',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  label TEXT DEFAULT '',
  color TEXT DEFAULT '#a855f7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  staff_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'staff')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT ''
);

INSERT INTO app_settings (key, value) VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- INDEXES
-- ==========================================================

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_subject ON tasks(subject_id);
CREATE INDEX idx_subtasks_task ON subtasks(task_id);
CREATE INDEX idx_subjects_user ON subjects(user_id);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(started_at);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_room_messages ON study_room_messages(room_id);
CREATE INDEX idx_room_participants ON study_room_participants(room_id);
CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(completed_date);
CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcards_review ON flashcards(next_review);
CREATE INDEX idx_schedule_slots ON schedule_slots(schedule_id);
CREATE INDEX idx_badges_user ON badges(user_id);

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all users" ON users FOR SELECT USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete users" ON users FOR DELETE USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can delete profile" ON profiles FOR DELETE USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Users can view own subjects" ON subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subjects" ON subjects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subtasks" ON subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subtasks" ON subtasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Badges are publicly readable" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can manage own badges" ON badges FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own friendships" ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Reactions are readable on public content" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own reactions" ON reactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);
CREATE POLICY "Admin can select all messages" ON messages FOR SELECT USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete messages" ON messages FOR DELETE USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Users can view groups they belong to" ON message_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM message_group_members WHERE group_id = message_groups.id AND user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON message_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view members of their groups" ON message_group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM message_group_members mgm WHERE mgm.group_id = message_group_members.group_id AND mgm.user_id = auth.uid()));
CREATE POLICY "Users can manage group membership" ON message_group_members FOR ALL
  USING (EXISTS (SELECT 1 FROM message_groups WHERE id = group_id AND created_by = auth.uid()));

CREATE POLICY "Public rooms are readable" ON study_rooms FOR SELECT
  USING (is_public = true OR host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM study_room_participants WHERE room_id = study_rooms.id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can create rooms" ON study_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON study_rooms FOR UPDATE
  USING (auth.uid() = host_id);
CREATE POLICY "Host can delete room" ON study_rooms FOR DELETE
  USING (auth.uid() = host_id);
CREATE POLICY "Admin can select all rooms" ON study_rooms FOR SELECT USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete rooms" ON study_rooms FOR DELETE USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Room participants are visible" ON study_room_participants FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admin can select all participants" ON study_room_participants FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Users can join rooms" ON study_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON study_room_participants FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Room members can read messages" ON study_room_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_room_participants WHERE room_id = study_room_messages.room_id AND user_id = auth.uid()));
CREATE POLICY "Room members can send messages" ON study_room_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM study_room_participants WHERE room_id = study_room_messages.room_id AND user_id = auth.uid()
  ));
CREATE POLICY "Admin can select all room messages" ON study_room_messages FOR SELECT USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete room messages" ON study_room_messages FOR DELETE USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Users can view own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own routines" ON routines FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own routine items" ON routine_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own routine items" ON routine_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can read all habits" ON habits FOR SELECT USING (auth.email() = 'mnartves@gmail.com');


CREATE POLICY "Users can view own habit logs" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habit logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can read all habit logs" ON habit_logs FOR SELECT USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Users can view own decks" ON flashcard_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own decks" ON flashcard_decks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own schedules" ON schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own schedules" ON schedules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own schedule slots" ON schedule_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own schedule slots" ON schedule_slots FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL USING (auth.email() = 'mnartves@gmail.com');

CREATE POLICY "Users can create own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all tickets" ON tickets FOR SELECT USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can manage tickets" ON tickets FOR UPDATE USING (auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can delete tickets" ON tickets FOR DELETE USING (auth.email() = 'mnartves@gmail.com');

-- Ticket messages (conversación)
CREATE POLICY "Users can create ticket messages" ON ticket_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()
  ) OR auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Users can view own ticket messages" ON ticket_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()
  ) OR auth.email() = 'mnartves@gmail.com');
CREATE POLICY "Admin can manage all ticket messages" ON ticket_messages FOR ALL
  USING (auth.email() = 'mnartves@gmail.com');

-- App Settings
CREATE POLICY "Everyone can read app settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage app settings" ON app_settings FOR ALL USING (auth.email() = 'mnartves@gmail.com');
