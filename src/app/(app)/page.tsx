import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/repositories/workspaces.repository";
import { createWorkspace } from "@/services/workspace.service";

export const dynamic = "force-dynamic";

/** Root app page — redirect to the user's first workspace (or create one). */
export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workspaces = await getUserWorkspaces(user.id);

  if (workspaces.length === 0) {
    const ws = await createWorkspace(user.id, "Mi Espacio");
    redirect(`/w/${ws.id}`);
  }

  redirect(`/w/${workspaces[0]!.id}`);
}
