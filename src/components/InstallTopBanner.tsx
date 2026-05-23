import { useInstallPrompt } from "@/contexts/InstallPromptContext";
import { Download, X } from "lucide-react";
import logo from "@/assets/logo-new.png";

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
      await promptInstall();
    } else {
      // iOS — open the bottom sheet instructions
      window.dispatchEvent(new CustomEvent("muffigout:open-install-sheet"));
    }
  };

  return (
    <div className="sticky top-0 z-[60] bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-3 py-2 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
          <img src={logo} alt="MUFFIGOUT" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold leading-tight truncate">
            MUFFIGOUT APPAREL HUB
          </p>
          <p className="text-[10px] opacity-80 leading-tight truncate">
            Install app for faster shopping & exclusive drops
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-primary text-xs font-bold px-4 py-1.5 rounded-full shrink-0 hover:bg-white/90 transition-colors flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={dismissForSession}
          aria-label="Dismiss install prompt"
          className="text-primary-foreground/70 hover:text-primary-foreground shrink-0 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallTopBanner;
