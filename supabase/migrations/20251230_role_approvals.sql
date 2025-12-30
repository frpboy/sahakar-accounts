-- Approval workflow for privileged role assignments
CREATE TABLE IF NOT EXISTS public.role_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL CHECK (requested_role = ANY (ARRAY['superadmin'])),
  old_role text,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','approved','rejected'])),
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid NULL REFERENCES public.users(id),
  approved_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS role_approvals_target_idx ON public.role_approvals (target_user_id, status);
CREATE INDEX IF NOT EXISTS role_approvals_requested_by_idx ON public.role_approvals (requested_by);
