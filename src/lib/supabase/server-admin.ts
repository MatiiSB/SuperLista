import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key. Bypasses RLS.
 *
 * Use ONLY in Route Handlers and Server Actions for operations that need to
 * circumvent RLS (e.g., NFC guest resolution, joining workspaces via invite
 * code). Never expose the service role key to the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
