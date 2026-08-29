-- ==========================================================
-- TICKETS COMO CONVERSACIÓN
-- Crea la tabla de mensajes y sus políticas RLS.
-- Ejecuta esto una sola vez en el SQL Editor de Supabase.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'staff')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can view own ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admin can manage all ticket messages" ON public.ticket_messages;

CREATE POLICY "Users can create ticket messages" ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()
    )
    OR auth.email() = 'mnartves@gmail.com'
  );

CREATE POLICY "Users can view own ticket messages" ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()
    )
    OR auth.email() = 'mnartves@gmail.com'
  );

CREATE POLICY "Admin can manage all ticket messages" ON public.ticket_messages
  FOR ALL
  USING (auth.email() = 'mnartves@gmail.com');

-- Permitir al admin eliminar tickets (borra también sus mensajes por CASCADE)
DROP POLICY IF EXISTS "Admin can delete tickets" ON public.tickets;
CREATE POLICY "Admin can delete tickets" ON public.tickets
  FOR DELETE
  USING (auth.email() = 'mnartves@gmail.com');

-- Recarga la caché de esquema para que PostgREST vea la tabla nueva
NOTIFY pgrst, 'reload schema';
