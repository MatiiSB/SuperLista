"use client";

import { useEffect, useState } from "react";
import { ShoppingList } from "@/features/lists/components/shopping-list";
import { establishGuestSessionAction } from "@/features/nfc/actions";
import type { CategoryMap } from "@/features/lists/categories";
import type { ShoppingList as ShoppingListType, ShoppingItem } from "@/types/list";

/**
 * Wraps the ShoppingList for NFC guest access. Establishes a guest session
 * cookie on mount (so server actions can validate the guest) and passes the
 * guest JWT for realtime subscriptions. No Supabase Auth user is created.
 *
 * Guests see the workspace's learned categories and supermarket order (fetched
 * via the admin client in the NFC page) but can't persist category picks
 * (canEdit=false) — setProductCategoryAction requires an authenticated user.
 */
export function GuestListWrapper({
  list,
  items,
  guestJwt,
  sessionToken,
  categoryMap,
  categoryOrder,
}: {
  list: ShoppingListType;
  items: ShoppingItem[];
  guestJwt: string;
  sessionToken: string;
  categoryMap: CategoryMap;
  categoryOrder: string[] | null;
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
    <ShoppingList
      list={list}
      items={items}
      guestMode
      guestJwt={guestJwt}
      categoryMap={categoryMap}
      categoryOrder={categoryOrder}
      canEdit={false}
    />
  );
}
