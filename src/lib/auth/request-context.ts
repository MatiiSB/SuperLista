import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateGuestSession } from "@/services/guest-session.service";

/**
 * Resolves the current request's actor: an authenticated user, a NFC guest, or
 * anonymous (neither). Used by server actions to pick the right auth path.
 *
 * - Authenticated users go through the RLS-protected server client.
 * - Guests go through the service role client with explicit list-scoping.
 */

export type RequestContext =
  | { kind: "user"; userId: string }
  | { kind: "guest"; listId: string }
  | { kind: "anonymous" };

export async function getRequestContext(): Promise<RequestContext> {
  // 1. Check for an authenticated (non-anonymous) Supabase user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !user.is_anonymous) {
    return { kind: "user", userId: user.id };
  }

  // 2. Check for a guest session cookie.
  const cookieStore = await cookies();
  const guestToken = cookieStore.get("guest-session")?.value;
  if (guestToken) {
    try {
      const session = await validateGuestSession(guestToken);
      if (session) return { kind: "guest", listId: session.shoppingListId };
    } catch {
      // Expired or invalid session — fall through to anonymous.
    }
  }

  return { kind: "anonymous" };
}
