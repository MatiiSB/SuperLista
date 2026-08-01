"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/**
 * Non-inCRusive install banner. On Android/Chrome it uses the captured
 * `beforeinstallprompt` event; on iOS it shows a manual hint (Safari offers no
 * programmatic install). Hidden once installed or dismissed.
 */
export function InstallPrompt() {
  const { canInstall, isIOS, installed, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (installed || dismissed) return null;
  // Only show when there's something actionable.
  if (!canInstall && !isIOS) return null;

  const handleInstall = () => {
    void promptInstall();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="bg-card text-card-foreground flex w-full max-w-sm items-center gap-3 rounded-xl border p-3 shadow-lg">
        <Download className="text-primary size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Instalar SuperLista</p>
          <p className="text-muted-foreground truncate text-xs">
            {isIOS
              ? "Compartir → Agregar a pantalla de inicio"
              : "Acceso rápido desde tu pantalla de inicio"}
          </p>
        </div>
        {!isIOS && (
          <Button size="sm" onClick={handleInstall}>
            Instalar
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>
    </div>
  );
}
