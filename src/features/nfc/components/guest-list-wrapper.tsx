"use client";

import { useEffect, useState } from "react";
import { ShoppingList } from "@/features/lists/components/shopping-list";
import { establishGuestSessionAction } from "@/features/nfc/actions";
import type { ShoppingList as ShoppingListType, ShoppingItem } from "@/types/list";

/**
 * Wraps the ShoppingList for NFC guest access. Establishes a guest session
 * cookie on mount (so server actions can validate the guest) and passes the
 * guest JWT for realtime subscriptions. No Supabase Auth user is created.
 */
export function GuestListWrapper({
  list,
  items,
  guestJwt,
  sessionToken,
}: {
  list: ShoppingListType;
  items: ShoppingItem[];
  guestJwt: string;
  sessionToken: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    establishGuestSessionAction(sessionToken)
      .then(() => setReady(true))
      .catch(() => setReady(true)); // proceed even if cookie fails — JWT still works for realtime
  }, [sessionToken]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando…</p>
      </div>
    );
  }

  return (
    <ShoppingList list={list} items={items} guestMode guestJwt={guestJwt} />
  );
}
