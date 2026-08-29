-- ==========================================================
-- FIX: Recursión infinita en study_room_participants
-- La política se auto-referenciaba (consultaba la misma tabla
-- dentro de su propio USING), provocando
-- "infinite recursion detected in policy".
-- Forma NO recursiva: cada usuario solo ve sus propias filas,
-- el admin ve todas. (La app no lista participantes, así que
-- no se necesita una consulta cruzada.)
-- ==========================================================

DROP POLICY IF EXISTS "Room participants are visible" ON study_room_participants;
DROP POLICY IF EXISTS "Admin can select all participants" ON study_room_participants;

CREATE POLICY "Room participants are visible" ON study_room_participants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can select all participants" ON study_room_participants
  FOR SELECT
  USING (auth.email() = 'mnartves@gmail.com');

NOTIFY pgrst, 'reload schema';
