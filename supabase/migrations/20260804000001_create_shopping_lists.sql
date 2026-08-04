-- ============================================================================
-- Shopping lists: lists within a workspace.
-- ============================================================================

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Lista',
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shopping_lists_set_updated_at on public.shopping_lists;
create trigger shopping_lists_set_updated_at
  before update on public.shopping_lists
  for each row execute function public.set_updated_at();

create index if not exists shopping_lists_workspace_id_idx
  on public.shopping_lists(workspace_id);

-- ============================================================================
-- Shopping items: products within a shopping list.
-- ============================================================================

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid,
  custom_name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit text,
  checked boolean not null default false,
  checked_at timestamptz,
  notes text,
  barcode text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shopping_items_set_updated_at on public.shopping_items;
create trigger shopping_items_set_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();

-- Auto-set/clear checked_at when checked changes.
create or replace function public.set_checked_at()
returns trigger
language plpgsql
as $$
begin
  if new.checked and not coalesce(old.checked, false) then
    new.checked_at = now();
  elsif not new.checked and coalesce(old.checked, false) then
    new.checked_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists shopping_items_set_checked_at on public.shopping_items;
create trigger shopping_items_set_checked_at
  before update on public.shopping_items
  for each row execute function public.set_checked_at();

create index if not exists shopping_items_list_id_idx
  on public.shopping_items(shopping_list_id);

-- ============================================================================
-- Helper functions for RLS (security definer → bypass RLS internally).
-- ============================================================================

-- Is the user a member of the workspace that owns this list?
create or replace function public.is_list_member(p_list_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.shopping_lists sl
    join public.workspace_members wm on wm.workspace_id = sl.workspace_id
    where sl.id = p_list_id and wm.user_id = p_user_id
  );
$$;

-- Is the user an EDITOR or OWNER of the workspace that owns this list?
create or replace function public.is_list_editor(p_list_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.shopping_lists sl
    join public.workspace_members wm on wm.workspace_id = sl.workspace_id
    where sl.id = p_list_id and wm.user_id = p_user_id
      and wm.role in ('OWNER', 'EDITOR')
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;

-- Shopping lists: visible to workspace members; editable by EDITOR+.
create policy "Lists viewable by members"
  on public.shopping_lists for select
  using (public.is_workspace_member(shopping_lists.workspace_id, auth.uid()));

create policy "Editors create lists"
  on public.shopping_lists for insert
  with check (public.is_workspace_editor(shopping_lists.workspace_id, auth.uid()));

create policy "Editors update lists"
  on public.shopping_lists for update
  using (public.is_list_editor(shopping_lists.id, auth.uid()))
  with check (public.is_list_editor(shopping_lists.id, auth.uid()));

create policy "Owners delete lists"
  on public.shopping_lists for delete
  using (public.is_workspace_owner(shopping_lists.workspace_id, auth.uid()));

-- Shopping items: visible to workspace members; editable by EDITOR+.
create policy "Items viewable by members"
  on public.shopping_items for select
  using (public.is_list_member(shopping_items.shopping_list_id, auth.uid()));

create policy "Editors add items"
  on public.shopping_items for insert
  with check (public.is_list_editor(shopping_items.shopping_list_id, auth.uid()));

create policy "Editors update items"
  on public.shopping_items for update
  using (public.is_list_editor(shopping_items.shopping_list_id, auth.uid()))
  with check (public.is_list_editor(shopping_items.shopping_list_id, auth.uid()));

create policy "Editors delete items"
  on public.shopping_items for delete
  using (public.is_list_editor(shopping_items.shopping_list_id, auth.uid()));

-- ============================================================================
-- Realtime: broadcast changes on shopping_items and shopping_lists.
-- ============================================================================

alter publication supabase_realtime add table public.shopping_items;
alter publication supabase_realtime add table public.shopping_lists;
