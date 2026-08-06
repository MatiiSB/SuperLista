import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace, getCategoryOrder } from "@/repositories/workspaces.repository";
import { getListsInWorkspace } from "@/repositories/shopping-lists.repository";
import { getNfcTags } from "@/repositories/nfc-tags.repository";
import { getMembers, getUserRole } from "@/repositories/workspace-members.repository";
import { getInvitations } from "@/repositories/workspace-invitations.repository";
import { NfcAdmin } from "@/features/nfc/components/nfc-admin";
import { ListsAdmin } from "@/features/lists/components/lists-admin";
import { InvitationsAdmin } from "@/features/workspaces/components/invitations-admin";
import { MembersAdmin } from "@/features/workspaces/components/members-admin";
import { CategoryOrderAdmin } from "@/features/workspaces/components/category-order-admin";
import { WorkspaceGeneralAdmin } from "@/features/workspaces/components/workspace-general-admin";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [workspace, role, lists, nfcTags, invitations, members, categoryOrder] = await Promise.all([
    getWorkspace(workspaceId),
    getUserRole(workspaceId, user.id),
    getListsInWorkspace(workspaceId),
    getNfcTags(workspaceId),
    getInvitations(workspaceId),
    getMembers(workspaceId),
    getCategoryOrder(workspaceId),
  ]);

  if (!workspace || !role) notFound();

  const isOwner = role === "OWNER";
  const canEdit = isOwner || role === "EDITOR";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href={`/w/${workspaceId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm">
            Administra el workspace, sus listas, etiquetas NFC, invitaciones y
            miembros.
          </p>
        </div>
      </header>

      {isOwner && (
        <WorkspaceGeneralAdmin workspaceId={workspaceId} name={workspace.name} />
      )}

      <ListsAdmin lists={lists} canEdit={canEdit} canDelete={isOwner} />

      {isOwner && (
        <CategoryOrderAdmin workspaceId={workspaceId} order={categoryOrder} />
      )}

      {isOwner && <NfcAdmin tags={nfcTags} lists={lists} />}

      {isOwner && (
        <InvitationsAdmin
          invitations={invitations}
          workspaceId={workspaceId}
        />
      )}

      <MembersAdmin
        members={members}
        currentUserId={user.id}
        isOwner={isOwner}
      />
    </main>
  );
}
