import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryMap } from "@/features/lists/categories";

/**
 * Data access for learned product-category mappings. RLS ensures only workspace
 * members can read and editors+ can write. The `*ForGuest` variants use the
 * admin client to bypass RLS for NFC guest access (no authenticated session).
 */

/** Query the learned map with a given client. */
async function fetchCategoryMap(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<CategoryMap> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("name_normalized, category_slug")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  const map: CategoryMap = {};
  for (const row of data ?? []) {
    map[row.name_normalized as string] = row.category_slug as string;
  }
  return map;
}

/** Get the full learned category map for a workspace (normalized name → slug). */
export async function getCategoryMap(
  workspaceId: string,
): Promise<CategoryMap> {
  return fetchCategoryMap(await createClient(), workspaceId);
}

/** Same as getCategoryMap but via the admin client (for NFC guests). */
export async function getCategoryMapForGuest(
  workspaceId: string,
): Promise<CategoryMap> {
  return fetchCategoryMap(createAdminClient(), workspaceId);
}

/**
 * Upsert a learned product → category mapping (editor+, enforced by RLS).
 *
 * Implemented as an explicit SELECT → INSERT/UPDATE rather than a single
 * `.upsert()`. Supabase's `.upsert()` compiles to `INSERT ... ON CONFLICT DO
 * UPDATE`, whose RLS rewrite applies both the INSERT and UPDATE policies within
 * one statement and can raise `42501 new row violates row-level security
 * policy` even when each policy passes individually. Splitting the operation
 * lets each branch trigger a single, simple policy check (INSERT → insert
 * WITH CHECK; UPDATE → update USING + WITH CHECK), which are the policies
 * already verified to pass for workspace editors.
 */
export async function upsertProductCategory(
  workspaceId: string,
  nameNormalized: string,
  categorySlug: string,
): Promise<void> {
  const supabase = await createClient();

  // 1. Does a learned mapping already exist for this product in this workspace?
  const { data: existing, error: selectError } = await supabase
    .from("product_categories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name_normalized", nameNormalized)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    // 2a. Update the existing mapping — gated by the "Editors update product
    // categories" policy (USING + WITH CHECK is_workspace_editor).
    const { error: updateError } = await supabase
      .from("product_categories")
      .update({ category_slug: categorySlug })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return;
  }

  // 2b. Insert — gated by the "Editors insert product categories" policy.
  const { error: insertError } = await supabase
    .from("product_categories")
    .insert({
      workspace_id: workspaceId,
      name_normalized: nameNormalized,
      category_slug: categorySlug,
    });
  if (!insertError) return;

  // 2c. A concurrent insert raced between our SELECT and INSERT and created
  // the row (unique violation 23505). Fall back to updating that now-existing
  // row by its natural key. This is the concurrency-safe equivalent of
  // ON CONFLICT DO UPDATE, kept as separate statements so each triggers a
  // single RLS policy check (a single .upsert() re-applies both the INSERT
  // and UPDATE policies in one statement and can raise 42501).
  if (insertError.code !== "23505") throw insertError;

  const { error: raceUpdateError } = await supabase
    .from("product_categories")
    .update({ category_slug: categorySlug })
    .eq("workspace_id", workspaceId)
    .eq("name_normalized", nameNormalized);
  if (raceUpdateError) throw raceUpdateError;
}
