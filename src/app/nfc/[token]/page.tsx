import { resolveNfcTag, getItemsForGuest } from "@/services/nfc.service";
import { createGuestSession } from "@/services/guest-session.service";
import { signGuestJwt } from "@/lib/auth/guest-jwt";
import { recordAudit } from "@/services/audit.service";
import { GuestListWrapper } from "@/features/nfc/components/guest-list-wrapper";

export const dynamic = "force-dynamic";

/** NFC tag access — opens the associated list directly (no intermediate screens). */
export default async function NfcPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let resolved;
  try {
    resolved = await resolveNfcTag(token);
  } catch {
    return <ErrorState message="Error al leer la etiqueta." />;
  }

  if (!resolved) {
    return <ErrorState message="Etiqueta no encontrada o deshabilitada." />;
  }

  // Create a guest session and sign a JWT scoped to this list.
  const session = await createGuestSession(resolved.tag.id, resolved.list.id);
  const guestJwt = await signGuestJwt(session.shoppingListId);

  recordAudit({
    workspaceId: null,
    actorType: "guest",
    actorId: null,
    action: "nfc.use",
    entityType: "nfc_tag",
    entityId: resolved.tag.id,
    metadata: { shopping_list_id: resolved.list.id },
  });

  const items = await getItemsForGuest(resolved.list.id);

  return (
    <GuestListWrapper
      list={resolved.list}
      items={items}
      guestJwt={guestJwt}
      sessionToken={session.token}
    />
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold">NFC</h1>
      <p className="text-muted-foreground text-sm">{message}</p>
    </main>
  );
}
