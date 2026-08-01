"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hydration-safe flag: `false` on the server and during the first client paint,
 * `true` once the client has hydrated. Avoids `setState`-in-effect and mismatch.
 */
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

/**
 * Captures the `beforeinstallprompt` event (Android/Chrome) so the UI can show
 * a custom install button. iOS Safari never fires this event — use `isIOS` to
 * render a manual "Add to Home Screen" hint instead.
 */
export function useInstallPrompt() {
  const hydrated = useHydrated();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [userInstalled, setUserInstalled] = useState(false);

  const installed = hydrated && (detectStandalone() || userInstalled);
  const isIOS = hydrated && detectIOS();

  useEffect(() => {
    // Only subscribe after hydration, and skip if already running standalone.
    if (!hydrated || detectStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setUserInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [hydrated]);

  const promptInstall = useCallback(async () => {
    if (!prompt) return "unavailable" as const;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    return outcome;
  }, [prompt]);

  return {
    /** Android/Chrome: a custom install prompt can be shown. */
    canInstall: prompt !== null,
    /** The PWA is already running standalone (installed). */
    installed,
    /** iOS Safari (needs a manual hint; no programmatic install). */
    isIOS,
    promptInstall,
  };
}
