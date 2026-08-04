import { createAdminClient } from "@/lib/supabase/server-admin";

/**
 * Guest session lifecycle — create and validate NFC guest sessions.
 * Uses the admin client because guest_sessions has no RLS policies (service
 * role only).
 */

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours.

export interface GuestSession {
  token: string;
  shoppingListId: string;
}

/**
 * Create a new guest session scoped to a shopping list via an NFC tag.
 * Returns the session token (UUID) to store in an HTTP-only cookie.
 */
export async function createGuestSession(
  nfcTagId: string,
  shoppingListId: string,
): Promise<GuestSession> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("guest_sessions")
    .insert({
      nfc_tag_id: nfcTagId,
      shopping_list_id: shoppingListId,
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    })
    .select("token, shopping_list_id")
    .single();

  if (error) throw error;

  return {
    token: data.token as string,
    shoppingListId: data.shopping_list_id as string,
  };
}

/**
 * Validate a guest session token. Returns the scoped list ID if the session
 * exists and hasn't expired, otherwise null. Updates last_active_at.
 */
export async function validateGuestSession(
  token: string,
): Promise<GuestSession | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("guest_sessions")
    .select("token, shopping_list_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const expiresAt = new Date(data.expires_at as string).getTime();
  if (expiresAt < Date.now()) return null;

  // Fire-and-forget: refresh last_active_at.
  admin
    .from("guest_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("token", token)
    .then(() => {});

  return {
    token: data.token as string,
    shoppingListId: data.shopping_list_id as string,
  };
}
