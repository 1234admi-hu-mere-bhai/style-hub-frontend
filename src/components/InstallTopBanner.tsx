import { useInstallPrompt } from "@/contexts/InstallPromptContext";
import { Download, X } from "lucide-react";
import logo from "@/assets/logo-new.png";
import { toast } from "sonner";

const InstallTopBanner = () => {
  const {
    canInstall,
    showIOSHint,
    isStandalone,
    isDismissedThisSession,
    promptInstall,
    dismissForSession,
  } = useInstallPrompt();

  if (isStandalone || isDismissedThisSession) return null;
  if (!canInstall && !showIOSHint) return null;

  const handleInstall = async () => {
    if (canInstall) {
      const loadingId = toast.loading("Installing MUFFIGOUT App…", {
        description: "Please confirm the install prompt on your device.",
      });
      const result = await promptInstall();
      toast.dismiss(loadingId);
      if (result === "accepted") {
        toast.success("App installed successfully", {
          description: "Open it from your home screen anytime.",
        });
        return;
      }
    }
    window.dispatchEvent(new CustomEvent("muffigout:open-install-sheet"));
  };

  return (
    <div className="sticky top-0 z-[60] border-b border-primary/20 bg-background/95 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-3 py-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-secondary/60 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-border">
          <img src={logo} alt="MUFFIGOUT" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold leading-tight truncate text-primary tracking-[0.12em] uppercase">
            MUFFIGOUT APPAREL HUB
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight truncate">
            Install app for faster shopping & exclusive drops
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shrink-0 hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm shadow-primary/20"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={dismissForSession}
          aria-label="Dismiss install prompt"
          className="text-muted-foreground hover:text-foreground shrink-0 p-1.5 rounded-full hover:bg-secondary/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallTopBanner;
