-- ============================================================
-- Owner & staff helper functions
-- ============================================================

-- Hardcoded owner emails (super-admins, can never be removed)
CREATE OR REPLACE FUNCTION public.is_owner(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _uid
      AND lower(email) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com')
  )
$$;

-- ============================================================
-- staff_members table
-- ============================================================
CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_by uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX idx_staff_members_email ON public.staff_members(lower(email));

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER staff_members_touch_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Active-staff helper (owners always count as active staff)
CREATE OR REPLACE FUNCTION public.is_active_staff(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner(_uid)
  OR EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = _uid AND status = 'active'
  )
$$;

-- Module permission check (owners always pass)
CREATE OR REPLACE FUNCTION public.staff_has_module(_uid uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner(_uid)
  OR EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = _uid
      AND status = 'active'
      AND COALESCE((permissions ->> _module)::boolean, false) = true
  )
$$;

-- staff_members policies
CREATE POLICY "Owners manage staff"
  ON public.staff_members FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Staff can view own record"
  ON public.staff_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- staff_invites table
-- ============================================================
CREATE TABLE public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_invites_email ON public.staff_invites(lower(email));
CREATE INDEX idx_staff_invites_token ON public.staff_invites(token);

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage invites"
  ON public.staff_invites FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- ============================================================
-- staff_activity_log table
-- ============================================================
CREATE TABLE public.staff_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text NOT NULL DEFAULT '',
  actor_role text NOT NULL DEFAULT 'staff' CHECK (actor_role IN ('owner', 'staff')),
  module text NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  summary text NOT NULL DEFAULT '',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_activity_actor ON public.staff_activity_log(actor_user_id, created_at DESC);
CREATE INDEX idx_staff_activity_created ON public.staff_activity_log(created_at DESC);
CREATE INDEX idx_staff_activity_module ON public.staff_activity_log(module, created_at DESC);

ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view activity log"
  ON public.staff_activity_log FOR SELECT
  TO authenticated
  USING (public.is_owner(auth.uid()));

-- ============================================================
-- log helper (SECURITY DEFINER, called from edge functions)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_staff_activity(
  _actor_user_id uuid,
  _actor_email text,
  _actor_role text,
  _module text,
  _action text,
  _target_table text,
  _target_id text,
  _summary text,
  _metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.staff_activity_log(
    actor_user_id, actor_email, actor_role, module, action,
    target_table, target_id, summary, metadata
  ) VALUES (
    _actor_user_id, _actor_email, _actor_role, _module, _action,
    _target_table, _target_id, _summary, _metadata
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_staff_activity(uuid, text, text, text, text, text, text, text, jsonb) FROM public, anon, authenticated;