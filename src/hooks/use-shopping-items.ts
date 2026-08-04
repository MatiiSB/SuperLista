"use client";

import { useEffect, useState } from "react";
import {
  createClient as createSupabaseClient,
  type RealtimeChannel,
} from "@supabase/supabase-js";
import type { ShoppingItem } from "@/types/list";
import { createClient } from "@/lib/supabase/client";

/**
 * Realtime hook for shopping items in a list.
 *
 * For authenticated users: uses the SSR browser client (has the auth session,
 * RLS enforces access).
 * For NFC guests: creates a standalone client with the guest JWT (role 'anon'
 * + guest_list_id claim), so RLS scopes realtime to the one list.
 *
 * Returns the current items array and a setter for direct updates (used after
 * server actions to confirm changes immediately, without waiting for the
 * realtime round-trip).
 */
export function useShoppingItems(
  listId: string,
  initialItems: ShoppingItem[],
  guestJwt?: string,
) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    // Guest: standalone client with the JWT. User: SSR browser client.
    const guestClient = guestJwt
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        )
      : null;
    const userClient = !guestJwt ? createClient() : null;
    const supabase = guestClient ?? userClient!;

    function subscribe() {
      channel = supabase
        .channel(`shopping_items:list=${listId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "shopping_items",
            filter: `shopping_list_id=eq.${listId}`,
          },
          (payload) => {
            const newItem = payload.new as ShoppingItem;
            setItems((prev) => {
              if (prev.some((i) => i.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shopping_items",
            filter: `shopping_list_id=eq.${listId}`,
          },
          (payload) => {
            const updated = payload.new as ShoppingItem;
            setItems((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i)),
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "shopping_items",
            filter: `shopping_list_id=eq.${listId}`,
          },
          (payload) => {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
          },
        )
        .subscribe();
    }

    if (guestJwt && guestClient) {
      // Set the guest JWT as the session so realtime sends it for RLS.
      guestClient.auth
        .setSession({ access_token: guestJwt, refresh_token: "guest" })
        .then(() => {
          if (!cancelled) subscribe();
        })
        .catch(() => {
          if (!cancelled) subscribe(); // try anyway
        });
    } else {
      subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [listId, guestJwt]);

  return [items, setItems] as const;
}
