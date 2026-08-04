import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListsInWorkspace } from "@/repositories/shopping-lists.repository";
import { getNfcTags } from "@/repositories/nfc-tags.repository";
import { getMembers, getUserRole } from "@/repositories/workspace-members.repository";
import { getInvitations } from "@/repositories/workspace-invitations.repository";
import { NfcAdmin } from "@/features/nfc/components/nfc-admin";
import { InvitationsAdmin } from "@/features/workspaces/components/invitations-admin";
import { MembersAdmin } from "@/features/workspaces/components/members-admin";

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

  const [role, lists, nfcTags, invitations, members] = await Promise.all([
    getUserRole(workspaceId, user.id),
    getListsInWorkspace(workspaceId),
    getNfcTags(workspaceId),
    getInvitations(workspaceId),
    getMembers(workspaceId),
  ]);

  if (!role) notFound();

  const isOwner = role === "OWNER";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground text-sm">
          Administra etiquetas NFC, invitaciones y miembros.
        </p>
      </header>

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
