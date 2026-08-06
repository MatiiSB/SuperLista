/**
 * Workspace domain types — a group of people who share shopping lists.
 */

export type WorkspaceRole = "OWNER" | "EDITOR" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  owner_id: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  /** Display fields enriched from public.profiles (nullable, not on the row). */
  email?: string | null;
  full_name?: string | null;
}

/** Workspace with the current user's role and member count (for switcher UI). */
export interface WorkspaceSummary {
  id: string;
  name: string;
  image_url: string | null;
  role: WorkspaceRole;
  member_count: number;
  list_count: number;
}
