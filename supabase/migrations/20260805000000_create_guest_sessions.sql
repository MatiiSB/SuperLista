-- ============================================================================
-- Guest sessions: ephemeral sessions for NFC guests, scoped to one list.
-- No Supabase Auth user is created — the guest gets a custom JWT with a
-- guest_list_id claim, and RLS scopes anon access to that list only.
-- ============================================================================

create table if not exists public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  nfc_tag_id uuid not null references public.nfc_tags(id) on delete cascade,
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- RLS enabled with NO policies — access is only via the service role client.
alter table public.guest_sessions enable row level security;

-- ============================================================================
-- Replace the old anon RLS policies (which used has_enabled_nfc_tag and let
-- any anonymous user edit ANY NFC-enabled list) with policies scoped to the
-- guest_list_id JWT claim. Now an anon user can only access the single list
-- their JWT is scoped to.
-- ============================================================================

drop policy if exists "Guests view items via NFC" on public.shopping_items;
drop policy if exists "Guests add items via NFC" on public.shopping_items;
drop policy if exists "Guests update items via NFC" on public.shopping_items;
drop policy if exists "Guests delete items via NFC" on public.shopping_items;
drop policy if exists "Guests view lists via NFC" on public.shopping_lists;

-- Shopping items: anon guests scoped to their JWT list.
create policy "Guests view items via NFC"
  on public.shopping_items for select
  using (
    auth.role() = 'anon'
    and shopping_items.shopping_list_id = (auth.jwt() ->> 'guest_list_id')::uuid
  );

create policy "Guests add items via NFC"
  on public.shopping_items for insert
  with check (
    auth.role() = 'anon'
    and shopping_items.shopping_list_id = (auth.jwt() ->> 'guest_list_id')::uuid
  );

create policy "Guests update items via NFC"
  on public.shopping_items for update
  using (
    auth.role() = 'anon'
    and shopping_items.shopping_list_id = (auth.jwt() ->> 'guest_list_id')::uuid
  )
  with check (
    auth.role() = 'anon'
    and shopping_items.shopping_list_id = (auth.jwt() ->> 'guest_list_id')::uuid
  );

create policy "Guests delete items via NFC"
  on public.shopping_items for delete
  using (
    auth.role() = 'anon'
    and shopping_items.shopping_list_id = (auth.jwt() ->> 'guest_list_id')::uuid
  );

-- Shopping lists: anon guests can view only their JWT list.
create policy "Guests view lists via NFC"
  on public.shopping_lists for select
  using (
    auth.role() = 'anon'
    and shopping_lists.id = (auth.jwt() ->> 'guest_list_id')::uuid
  );

-- The old helper is no longer used by any policy.
drop function if exists public.has_enabled_nfc_tag(uuid);
