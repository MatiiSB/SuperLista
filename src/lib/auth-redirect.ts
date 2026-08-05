/**
 * Safe relative path for post-auth redirects, or "/" if the value is unsafe.
 * Guards against open-redirect via "//evil.com" or absolute "https://evil.com".
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
