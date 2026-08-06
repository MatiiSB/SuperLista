import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/repositories/workspaces.repository";
import { SessionMenu } from "@/features/auth/components/session-menu";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";

// Auth-guarded shell — always rendered per request (never prerendered).
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workspaces = await getUserWorkspaces(user.id);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-2">
        <WorkspaceSwitcher workspaces={workspaces} />
        <SessionMenu
          user={{
            email: user.email ?? null,
            isAnonymous: user.is_anonymous ?? false,
            fullName:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : null,
          }}
          workspaces={workspaces}
        />
      </header>
      {children}
    </div>
  );
}
