import { useEffect, useState, useCallback } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "muffigout_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setDeferred(null);
      localStorage.removeItem(DISMISS_KEY);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const wasRecentlyDismissed = useCallback(() => {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < DISMISS_COOLDOWN_MS;
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDeferred(null);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(DISMISS_KEY);
    }
    return outcome;
  }, [deferred]);

  const canInstall = !!deferred && !isStandalone;
  const showIOSHint = isIOS && !isStandalone;

  return {
    canInstall,
    showIOSHint,
    isStandalone,
    wasRecentlyDismissed,
    promptInstall,
    dismiss,
  };
}
