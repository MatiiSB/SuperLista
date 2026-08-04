-- ============================================================================
-- NFC tags: physical tags that open a specific shopping list.
-- Guests can edit the list without authentication (Guest Editor).
-- ============================================================================

create table if not exists public.nfc_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null default 'Etiqueta NFC',
  secret_token text not null unique,
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists nfc_tags_secret_token_idx
  on public.nfc_tags(secret_token);

create index if not exists nfc_tags_shopping_list_id_idx
  on public.nfc_tags(shopping_list_id);

-- ============================================================================
-- Helper: does this list have an enabled NFC tag?
-- ============================================================================

create or replace function public.has_enabled_nfc_tag(p_list_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.nfc_tags
    where shopping_list_id = p_list_id and enabled = true
  );
$$;

-- ============================================================================
-- RLS for nfc_tags: managed by workspace owners only.
-- ============================================================================

alter table public.nfc_tags enable row level security;

create policy "NFC tags viewable by members"
  on public.nfc_tags for select
  using (exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = nfc_tags.workspace_id and wm.user_id = auth.uid()
  ));

create policy "Owners create NFC tags"
  on public.nfc_tags for insert
  with check (public.is_workspace_owner(nfc_tags.workspace_id, auth.uid()));

create policy "Owners update NFC tags"
  on public.nfc_tags for update
  using (public.is_workspace_owner(nfc_tags.workspace_id, auth.uid()))
  with check (public.is_workspace_owner(nfc_tags.workspace_id, auth.uid()));

create policy "Owners delete NFC tags"
  on public.nfc_tags for delete
  using (public.is_workspace_owner(nfc_tags.workspace_id, auth.uid()));

-- ============================================================================
-- Guest access via NFC: anonymous users (auth.role() = 'anon') can view and
-- edit items in lists that have an enabled NFC tag.
-- ============================================================================

create policy "Guests view items via NFC"
  on public.shopping_items for select
  using (auth.role() = 'anon' and public.has_enabled_nfc_tag(shopping_items.shopping_list_id));

create policy "Guests add items via NFC"
  on public.shopping_items for insert
  with check (auth.role() = 'anon' and public.has_enabled_nfc_tag(shopping_items.shopping_list_id));

create policy "Guests update items via NFC"
  on public.shopping_items for update
  using (auth.role() = 'anon' and public.has_enabled_nfc_tag(shopping_items.shopping_list_id))
  with check (auth.role() = 'anon' and public.has_enabled_nfc_tag(shopping_items.shopping_list_id));

create policy "Guests delete items via NFC"
  on public.shopping_items for delete
  using (auth.role() = 'anon' and public.has_enabled_nfc_tag(shopping_items.shopping_list_id));

-- Guests can also see the shopping list metadata (name, etc.) for NFC lists.
create policy "Guests view lists via NFC"
  on public.shopping_lists for select
  using (auth.role() = 'anon' and public.has_enabled_nfc_tag(shopping_lists.id));

-- Realtime for nfc_tags (so members see tag changes live).
alter publication supabase_realtime add table public.nfc_tags;
