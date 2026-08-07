-- ============================================================================
-- Product categories: learned product-name → category mappings, per workspace.
-- When a user picks a category for a product, it's stored here so the same
-- product auto-categorizes next time (never re-ask). RLS: members read,
-- editors+ manage.
--
-- Idempotent: safe to re-run in the Supabase SQL Editor (uses IF NOT EXISTS,
-- DROP ... IF EXISTS, and a guarded publication add).
-- ============================================================================

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name_normalized text not null,
  category_slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name_normalized)
);

drop trigger if exists product_categories_set_updated_at on public.product_categories;
create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

create index if not exists product_categories_workspace_id_idx
  on public.product_categories(workspace_id);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.product_categories enable row level security;

drop policy if exists "Members view product categories" on public.product_categories;
create policy "Members view product categories"
  on public.product_categories for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Editors insert product categories" on public.product_categories;
create policy "Editors insert product categories"
  on public.product_categories for insert
  with check (public.is_workspace_editor(workspace_id, auth.uid()));

drop policy if exists "Editors update product categories" on public.product_categories;
create policy "Editors update product categories"
  on public.product_categories for update
  using (public.is_workspace_editor(workspace_id, auth.uid()))
  with check (public.is_workspace_editor(workspace_id, auth.uid()));

drop policy if exists "Editors delete product categories" on public.product_categories;
create policy "Editors delete product categories"
  on public.product_categories for delete
  using (public.is_workspace_editor(workspace_id, auth.uid()));

-- ============================================================================
-- Realtime: broadcast changes so all members' lists update live.
-- Guarded add — `alter publication ... add table` has no IF NOT EXISTS form.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_categories'
  ) then
    alter publication supabase_realtime add table public.product_categories;
  end if;
end
$$;
