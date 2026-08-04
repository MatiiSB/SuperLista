-- ============================================================================
-- Data migration: transform existing user-centric lists into workspace-centric.
--
-- For each user who has lists:
--   1. Create a workspace (if they don't already have one).
--   2. Add the user as OWNER of that workspace.
--   3. Migrate their lists → shopping_lists.
--   4. Migrate their list_items → shopping_items.
--
-- Idempotent: safe to run multiple times. Old tables are NOT dropped.
-- ============================================================================

-- Step 1: Create a workspace for each user who has lists but no workspace yet.
insert into public.workspaces (id, owner_id, name, description, invite_code)
select
  gen_random_uuid(),
  l.user_id,
  'Mi Espacio',
  'Migrado automáticamente',
  public.generate_invite_code()
from (select distinct user_id from public.lists) l
where not exists (
  select 1 from public.workspaces w where w.owner_id = l.user_id
)
on conflict do nothing;

-- Step 2: Add each user as OWNER of their workspace (if not already a member).
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'OWNER'
from public.workspaces w
where not exists (
  select 1 from public.workspace_members wm
  where wm.workspace_id = w.id and wm.user_id = w.owner_id
)
on conflict do nothing;

-- Step 3: Migrate lists → shopping_lists.
-- Reuses the same ID. Marks the oldest list per workspace as default.
insert into public.shopping_lists (id, workspace_id, name, is_default, created_at, updated_at)
select
  l.id,
  w.id,
  l.name,
  row_number() over (partition by l.user_id order by l.created_at) = 1,
  l.created_at,
  l.updated_at
from public.lists l
join public.workspaces w on w.owner_id = l.user_id
where not exists (
  select 1 from public.shopping_lists sl where sl.id = l.id
)
on conflict do nothing;

-- Step 4: Migrate list_items → shopping_items.
-- Reuses the same ID. Maps list_id → shopping_list_id (same ID).
insert into public.shopping_items (
  id, shopping_list_id, custom_name, quantity, unit, checked, barcode, position, created_at, updated_at
)
select
  li.id,
  li.list_id,
  li.name,
  li.quantity,
  li.unit,
  li.checked,
  li.barcode,
  li.position,
  li.created_at,
  li.updated_at
from public.list_items li
where not exists (
  select 1 from public.shopping_items si where si.id = li.id
)
on conflict do nothing;
