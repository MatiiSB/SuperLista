import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));

  console.log("===== AUTH CALLBACK =====");
  console.log("URL:", request.url);
  console.log("CODE:", code);
  console.log("NEXT:", next);

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (!error) {
      console.log("LOGIN OK");

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.error("LOGIN ERROR:", error);
  }

  return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
}