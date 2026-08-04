/**
 * Guest JWT signing for NFC realtime access.
 *
 * Signs a custom JWT with the Supabase JWT secret (HS256 via Web Crypto). The
 * JWT carries `role: 'anon'` and a `guest_list_id` claim so RLS can scope the
 * anonymous user to exactly one shopping list — without creating a Supabase
 * Auth user.
 *
 * Runs server-side only. Never expose the JWT secret to the client.
 */

const GUEST_JWT_TTL_SECONDS = 60 * 60 * 24; // 24 hours — matches guest session.

function base64url(input: Uint8Array): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlJson(obj: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(obj)));
}

/**
 * Sign a guest JWT scoped to a single shopping list.
 * @returns The compact JWT string (header.payload.signature).
 */
export async function signGuestJwt(shoppingListId: string): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not set");

  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    role: "anon",
    guest_list_id: shoppingListId,
    iat: now,
    exp: now + GUEST_JWT_TTL_SECONDS,
  };

  const signingInput = `${base64urlJson(header)}.${base64urlJson(payload)}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}
