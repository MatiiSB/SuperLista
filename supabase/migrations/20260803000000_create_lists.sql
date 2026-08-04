-- ============================================================================
-- Lists: one or more shopping lists per user.
-- ============================================================================

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Mi Lista',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists lists_set_updated_at on public.lists;
create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

-- ============================================================================
-- List items: products within a list.
-- ============================================================================

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit text,
  checked boolean not null default false,
  barcode text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists list_items_set_updated_at on public.list_items;
create trigger list_items_set_updated_at
  before update on public.list_items
  for each row execute function public.set_updated_at();

create index if not exists list_items_list_id_idx on public.list_items(list_id);

-- ============================================================================
-- RLS: users can only access their own lists and the items within them.
-- ============================================================================

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Lists: owner-only CRUD.
create policy "Lists are viewable by owner"
  on public.lists for select
  using (auth.uid() = user_id);

create policy "Owners insert their own lists"
  on public.lists for insert
  with check (auth.uid() = user_id);

create policy "Owners update their own lists"
  on public.lists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners delete their own lists"
  on public.lists for delete
  using (auth.uid() = user_id);

-- List items: CRUD gated by ownership of the parent list.
create policy "Items are viewable by list owner"
  on public.list_items for select
  using (exists (
    select 1 from public.lists
    where id = list_id and user_id = auth.uid()
  ));

create policy "List owners insert items"
  on public.list_items for insert
  with check (exists (
    select 1 from public.lists
    where id = list_id and user_id = auth.uid()
  ));

create policy "List owners update items"
  on public.list_items for update
  using (exists (
    select 1 from public.lists
    where id = list_id and user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.lists
    where id = list_id and user_id = auth.uid()
  ));

create policy "List owners delete items"
  on public.list_items for delete
  using (exists (
    select 1 from public.lists
    where id = list_id and user_id = auth.uid()
  ));
