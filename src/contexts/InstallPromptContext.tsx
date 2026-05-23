import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SESSION_DISMISS_KEY = "muffigout_install_dismissed_session";
const INSTALLED_KEY = "muffigout_app_installed";

type Ctx = {
  canInstall: boolean;
  showIOSHint: boolean;
  isStandalone: boolean;
  wasInstalled: boolean;
  isDismissedThisSession: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismissForSession: () => void;
};

const InstallPromptContext = createContext<Ctx | null>(null);

export const InstallPromptProvider = ({ children }: { children: ReactNode }) => {
  const deferredRef = useRef<BIPEvent | null>(null);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [wasInstalled, setWasInstalled] = useState(
    () => localStorage.getItem(INSTALLED_KEY) === "1"
  );
  const [isDismissedThisSession, setIsDismissed] = useState(
    () => sessionStorage.getItem(SESSION_DISMISS_KEY) === "1"
  );

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const markInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setWasInstalled(true);
    };
    const markNotInstalled = () => {
      localStorage.removeItem(INSTALLED_KEY);
      setWasInstalled(false);
    };

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BIPEvent;
      setHasPrompt(true);
      // If browser is offering install, the app is NOT installed — clear stale flag
      markNotInstalled();
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      deferredRef.current = null;
      setHasPrompt(false);
      markInstalled();
      sessionStorage.removeItem(SESSION_DISMISS_KEY);
    };
    window.addEventListener("appinstalled", installedHandler);

    if (standalone) markInstalled();

    // Authoritative check via related apps API (Chrome/Android)
    const nav = navigator as any;
    if (typeof nav.getInstalledRelatedApps === "function") {
      nav
        .getInstalledRelatedApps()
        .then((apps: any[]) => {
          if (apps && apps.length > 0) markInstalled();
          else if (!standalone) markNotInstalled();
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const dismissForSession = useCallback(() => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    setIsDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    const evt = deferredRef.current;
    if (!evt) return "unavailable" as const;
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      deferredRef.current = null;
      setHasPrompt(false);
      if (outcome === "dismissed") dismissForSession();
      return outcome;
    } catch {
      return "unavailable" as const;
    }
  }, [dismissForSession]);

  const canInstall = hasPrompt && !isStandalone;
  const showIOSHint = isIOS && !isStandalone;

  return (
    <InstallPromptContext.Provider
      value={{
        canInstall,
        showIOSHint,
        isStandalone,
        wasInstalled,
        isDismissedThisSession,
        promptInstall,
        dismissForSession,
      }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
};

export const useInstallPrompt = () => {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) {
    throw new Error("useInstallPrompt must be used inside InstallPromptProvider");
  }
  return ctx;
};
