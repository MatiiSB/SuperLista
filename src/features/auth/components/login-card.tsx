"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const emailSchema = z.email("Email inválido");

function redirectTo(next?: string): string {
  const base = `${window.location.origin}/auth/callback`;
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

type LoadingState = "email" | null;

export function LoginCard({ error, next }: { error?: string; next?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<LoadingState>(null);

  async function handleEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Email inválido");
      return;
    }
    setLoading("email");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: redirectTo(next) },
    });
    if (error) {
      toast.error("No se pudo enviar el enlace. Intenta de nuevo.");
      setLoading(null);
      return;
    }
    toast.success("Revisa tu email para el enlace de acceso.");
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">SuperLista</h1>
        <p className="text-muted-foreground text-sm">
          Entra para ver y editar tus listas
        </p>
      </div>

      {error === "auth" && (
        <p className="text-destructive text-center text-sm">
          No se pudo completar el acceso. Intenta de nuevo.
        </p>
      )}

      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading !== null}>
          {loading === "email" ? "Enviando…" : "Continuar con email"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-xs">
        Al continuar aceptas crear una cuenta en SuperLista.
      </p>
    </div>
  );
}
