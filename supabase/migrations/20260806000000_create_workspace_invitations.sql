-- ============================================================================
-- Workspace invitations: secure UUID tokens with expiration, usage limits, and
-- revocation. Replaces the permanent, unlimited invite_code for new invites.
-- ============================================================================

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete set null,
  role text not null default 'EDITOR' check (role in ('EDITOR', 'VIEWER')),
  expires_at timestamptz,  -- null = no expiry
  max_uses integer,         -- null = unlimited
  use_count integer not null default 0,
  revoked_at timestamptz,   -- null = not revoked
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists workspace_invitations_token_idx
  on public.workspace_invitations(token);

create index if not exists workspace_invitations_workspace_id_idx
  on public.workspace_invitations(workspace_id);

-- ============================================================================
-- Helper: is the invitation token still valid? (security definer → bypass RLS)
-- ============================================================================

create or replace function public.is_invitation_valid(p_token uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_invitations inv
    where inv.token = p_token
      and inv.revoked_at is null
      and (inv.expires_at is null or inv.expires_at > now())
      and (inv.max_uses is null or inv.use_count < inv.max_uses)
  )
$$;

-- ============================================================================
-- RLS: members can view invitations; owners can manage them.
-- ============================================================================

alter table public.workspace_invitations enable row level security;

create policy "Members view invitations"
  on public.workspace_invitations for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Owners create invitations"
  on public.workspace_invitations for insert
  with check (public.is_workspace_owner(workspace_id, auth.uid()));

create policy "Owners update invitations"
  on public.workspace_invitations for update
  using (public.is_workspace_owner(workspace_id, auth.uid()))
  with check (public.is_workspace_owner(workspace_id, auth.uid()));

create policy "Owners delete invitations"
  on public.workspace_invitations for delete
  using (public.is_workspace_owner(workspace_id, auth.uid()));
