"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon, AppleIcon } from "./brand-icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const emailSchema = z.email("Email inválido");

function redirectTo(): string {
  return `${window.location.origin}/auth/callback`;
}

type LoadingState = "google" | "apple" | "email" | null;

export function LoginCard({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<LoadingState>(null);

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      toast.error(`No se pudo iniciar sesión con ${provider}.`);
      setLoading(null);
    }
    // On success Supabase redirects the browser to the OAuth provider.
  }

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
      options: { emailRedirectTo: redirectTo() },
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
        <p className="text-muted-foreground text-sm">Entra para ver y editar tus listas</p>
      </div>

      {error === "auth" && (
        <p className="text-destructive text-center text-sm">
          No se pudo completar el acceso. Intenta de nuevo.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          disabled={loading !== null}
          onClick={() => void handleOAuth("google")}
        >
          <GoogleIcon className="size-4" />
          Continuar con Google
        </Button>
        <Button
          variant="outline"
          disabled={loading !== null}
          onClick={() => void handleOAuth("apple")}
        >
          <AppleIcon className="size-4" />
          Continuar con Apple
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs uppercase">o</span>
        <div className="bg-border h-px flex-1" />
      </div>

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
