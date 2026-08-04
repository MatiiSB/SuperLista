import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. `createBrowserClient` keeps a singleton internally,
 * so calling this per render is cheap. Use only in Client Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
