-- ============================================================================
-- Workspaces: groups of people who share shopping lists.
-- ============================================================================

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi Espacio',
  description text,
  image_url text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Invite code generator: 4 random alphanumeric chars, hyphen, 4 more chars.
-- e.g. ABCD-91XF
-- ----------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text;
begin
  code := '';
  for i in 1..4 loop
    code := code || substr(chars, floor(random() * 36 + 1)::int, 1);
  end loop;
  code := code || '-';
  for i in 1..4 loop
    code := code || substr(chars, floor(random() * 36 + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- ----------------------------------------------------------------------------
-- Workspace members: users belonging to a workspace with a role.
-- ----------------------------------------------------------------------------

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER', 'EDITOR', 'VIEWER')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members(user_id);

-- ============================================================================
-- Helper functions for RLS (security definer → bypass RLS internally).
-- Avoids chicken-and-egg: owner can see workspace before membership row exists.
-- ============================================================================

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id and wm.user_id = p_user_id
  );
$$;

create or replace function public.is_workspace_editor(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id and wm.user_id = p_user_id
      and wm.role in ('OWNER', 'EDITOR')
  );
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id and w.owner_id = p_user_id
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Workspaces: visible to owner or members; editable/deletable by owner only.
create policy "Workspaces viewable by owner or members"
  on public.workspaces for select
  using (
    owner_id = auth.uid()
    or public.is_workspace_member(id, auth.uid())
  );

create policy "Owners update workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners delete workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

-- Any authenticated user can create a workspace (they become the owner).
create policy "Authenticated users create workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

-- Workspace members: visible to fellow members; managed by owner.
create policy "Members view membership"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Owners add members"
  on public.workspace_members for insert
  with check (public.is_workspace_owner(workspace_id, auth.uid()));

create policy "Owners update member roles"
  on public.workspace_members for update
  using (public.is_workspace_owner(workspace_id, auth.uid()))
  with check (public.is_workspace_owner(workspace_id, auth.uid()));

create policy "Owners remove members"
  on public.workspace_members for delete
  using (public.is_workspace_owner(workspace_id, auth.uid()));
