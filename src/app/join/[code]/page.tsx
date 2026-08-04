import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  joinWorkspace,
  joinWorkspaceViaInvitation,
} from "@/services/workspace.service";
import { recordAudit } from "@/services/audit.service";
import type { Workspace } from "@/types/workspace";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Join a workspace via invitation token (UUID) or legacy invite code. */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated — redirect to login.
  if (!user) redirect("/login");

  let workspace: Workspace | null = null;
  let errored = false;

  try {
    // UUID → new invitation system. Short code → legacy fallback.
    workspace = UUID_RE.test(code)
      ? await joinWorkspaceViaInvitation(user.id, code)
      : await joinWorkspace(user.id, code);
  } catch {
    errored = true;
  }

  if (errored) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold">Error</h1>
        <p className="text-muted-foreground text-sm">
          No se pudo unir al workspace. Intenta de nuevo.
        </p>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold">Invitación inválida</h1>
        <p className="text-muted-foreground text-sm">
          La invitación no es válida, expiró, o alcanzó su límite de usos.
        </p>
      </main>
    );
  }

  recordAudit({
    actorType: "user",
    actorId: user.id,
    workspaceId: workspace.id,
    action: UUID_RE.test(code) ? "invitation.join" : "workspace.join",
    entityType: "workspace",
    entityId: workspace.id,
  });

  redirect(`/w/${workspace.id}`);
}
