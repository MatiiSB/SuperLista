-- ============================================================================
-- Audit logs: record user and guest activity for security and debugging.
-- No RLS policies — written via the service role only. Read access will be
-- added later when the audit UI is built.
-- ============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_type text not null check (actor_type in ('user', 'guest')),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_workspace_id_idx
  on public.audit_logs(workspace_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;
-- No policies: insert/select/update/delete all blocked for client requests.
-- All access is via the service role (server-side audit service).
