-- ==========================================================
-- Permitir que el host borre sus propias salas
-- (la app ahora persiste las salas en study_rooms; el host
--  necesita poder eliminar las suyas desde la lista)
-- ==========================================================

DROP POLICY IF EXISTS "Host can delete room" ON study_rooms;
CREATE POLICY "Host can delete room" ON study_rooms
  FOR DELETE
  USING (auth.uid() = host_id);

NOTIFY pgrst, 'reload schema';
