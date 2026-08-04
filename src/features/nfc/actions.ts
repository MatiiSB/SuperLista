"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionResultWithData } from "@/types/list";
import type { NfcTag } from "@/types/nfc";
import {
  createNfcTag,
  deleteNfcTag,
  updateNfcTag,
} from "@/repositories/nfc-tags.repository";
import { validateGuestSession } from "@/services/guest-session.service";

/**
 * NFC tag management. Only workspace owners can manage tags (enforced by RLS).
 */

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return null;
  return user.id;
}

/**
 * Establish a guest session by setting an HTTP-only cookie. Called from the
 * GuestListWrapper on mount — cookies can't be set in a Server Component.
 */
export async function establishGuestSessionAction(
  sessionToken: string,
): Promise<ActionResult> {
  try {
    const session = await validateGuestSession(sessionToken);
    if (!session) return { ok: false, error: "Sesión inválida" };

    const cookieStore = await cookies();
    cookieStore.set("guest-session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h — matches the session expiry.
      path: "/",
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo establecer la sesión" };
  }
}

export async function createNfcTagAction(
  workspaceId: string,
  shoppingListId: string,
  name: string,
): Promise<ActionResultWithData<NfcTag>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const tag = await createNfcTag(workspaceId, shoppingListId, name);
    refresh();
    return { ok: true, data: tag };
  } catch {
    return { ok: false, error: "No se pudo crear la etiqueta NFC" };
  }
}

export async function updateNfcTagAction(
  tagId: string,
  patch: Partial<Pick<NfcTag, "name" | "enabled" | "shopping_list_id">>,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await updateNfcTag(tagId, patch);
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar la etiqueta" };
  }
}

export async function deleteNfcTagAction(tagId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await deleteNfcTag(tagId);
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la etiqueta" };
  }
}
