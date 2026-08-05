import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { LoginCard } from "@/features/auth/components/login-card";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;

  if (user) redirect(safeRedirectPath(params.next));

  return <LoginCard error={params.error} next={params.next} />;
}
