-- ============================================================================
-- Workspace category order: the supermarket aisle order, per workspace.
-- null = use the default order. Owner-managed via the existing
-- "Owners update workspaces" RLS policy; readable by all members via the
-- existing "Workspaces viewable by owner or members" policy.
-- ============================================================================

alter table public.workspaces add column if not exists category_order text[];
