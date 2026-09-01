-- ==========================================================
-- Deskly — Grupos de estudio: Notas compartidas + Llamadas WebRTC
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ==========================================================

-- ==========================================================
-- 1) NOTAS COMPARTIDAS DE GRUPO (shared notes)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.group_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.message_groups(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group notes view own group" ON public.group_notes;
DROP POLICY IF EXISTS "Group notes edit own group" ON public.group_notes;
DROP POLICY IF EXISTS "Group notes create own group" ON public.group_notes;

-- Los miembros del grupo pueden leer sus notas compartidas
CREATE POLICY "Group notes view own group" ON public.group_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_group_members
      WHERE group_id = group_notes.group_id AND user_id = auth.uid()
    )
  );

-- Los miembros pueden crear una nota compartida (una por grupo)
CREATE POLICY "Group notes create own group" ON public.group_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.message_group_members
      WHERE group_id = group_notes.group_id AND user_id = auth.uid()
    )
  );

-- Los miembros pueden editar las notas de sus grupos
CREATE POLICY "Group notes edit own group" ON public.group_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.message_group_members
      WHERE group_id = group_notes.group_id AND user_id = auth.uid()
    )
  );

-- ==========================================================
-- 2) SEÑALIZACIÓN DE LLAMADAS WebRTC (signaling)
-- Usa Supabase Realtime para intercambiar ofertas, respuestas e ICE.
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.group_call_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.message_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('join', 'leave', 'offer', 'answer', 'ice', 'chat')),
  sdp TEXT,
  ice_candidate TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_call_signaling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Call signaling read own group" ON public.group_call_signaling;
DROP POLICY IF EXISTS "Call signaling write own group" ON public.group_call_signaling;
DROP POLICY IF EXISTS "Call signaling delete own group" ON public.group_call_signaling;

-- Los miembros del grupo pueden leer la señalización de sus llamadas
CREATE POLICY "Call signaling read own group" ON public.group_call_signaling
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_group_members
      WHERE group_id = group_call_signaling.group_id AND user_id = auth.uid()
    )
  );

-- Los miembros pueden publicar señalización
CREATE POLICY "Call signaling write own group" ON public.group_call_signaling
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.message_group_members
      WHERE group_id = group_call_signaling.group_id AND user_id = auth.uid()
    )
  );

-- Los miembros pueden limpiar la señalización (terminar llamada)
CREATE POLICY "Call signaling delete own group" ON public.group_call_signaling
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.message_group_members
      WHERE group_id = group_call_signaling.group_id AND user_id = auth.uid()
    )
  );

-- Realtime para la señalización de llamadas
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_call_signaling;

NOTIFY pgrst, 'reload schema';
