import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginCard } from "@/features/auth/components/login-card";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  const params = await searchParams;
  return <LoginCard error={params.error} />;
}
