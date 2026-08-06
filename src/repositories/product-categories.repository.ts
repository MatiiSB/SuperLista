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

/** Upsert a learned product → category mapping (editor+, enforced by RLS). */
export async function upsertProductCategory(
  workspaceId: string,
  nameNormalized: string,
  categorySlug: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_categories")
    .upsert(
      {
        workspace_id: workspaceId,
        name_normalized: nameNormalized,
        category_slug: categorySlug,
      },
      { onConflict: "workspace_id,name_normalized" },
    );

  if (error) throw error;
}
