-- ==========================================================
-- FIX: Recursión infinita en study_room_participants
-- La política vieja se auto-referenciaba y provocaba
-- "infinite recursion detected in policy".
-- ==========================================================

DROP POLICY IF EXISTS "Room participants are visible" ON study_room_participants;
DROP POLICY IF EXISTS "Admin can select all participants" ON study_room_participants;

-- Forma NO recursiva: cada usuario ve su fila o las de las salas donde participa
CREATE POLICY "Room participants are visible" ON study_room_participants
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR room_id IN (SELECT room_id FROM study_room_participants WHERE user_id = auth.uid())
  );

-- El admin puede ver todos los participantes (para el panel admin / salas)
CREATE POLICY "Admin can select all participants" ON study_room_participants
  FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');

NOTIFY pgrst, 'reload schema';
