"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Shared logout sequence: await signOut → push /login → refresh.
 * `isPending` guards against double-clicks. On failure we surface a toast and
 * stay put (avoiding a redirect that could bounce back with a live session).
 */
export function useLogout() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    if (isPending) return;
    setIsPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("No se pudo cerrar la sesión. Intenta de nuevo.");
    } finally {
      setIsPending(false);
    }
  }

  return { logout, isPending };
}
