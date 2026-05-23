import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/contexts/InstallPromptContext";
import { Download, Share, Plus, Zap, Bell, Sparkles } from "lucide-react";
import logo from "@/assets/logo-new.png";
import { toast } from "sonner";

const APPEAR_DELAY_MS = 2000;

const InstallAppPrompt = () => {
  const {
    canInstall,
    showIOSHint,
    isDismissedThisSession,
    promptInstall,
    dismissForSession,
  } = useInstallPrompt();
  const [open, setOpen] = useState(false);

  // Auto-open once per session after a delay
  useEffect(() => {
    if (isDismissedThisSession) return;
    if (!canInstall && !showIOSHint) return;
    const t = setTimeout(() => setOpen(true), APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [canInstall, showIOSHint, isDismissedThisSession]);

  // Allow other components (top banner) to open this sheet on demand
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("muffigout:open-install-sheet", handler);
    return () => window.removeEventListener("muffigout:open-install-sheet", handler);
  }, []);

  const handleInstall = async () => {
    if (!canInstall) return;
    const loadingId = toast.loading("Installing MUFFIGOUT App…", {
      description: "Please confirm the install prompt on your device.",
    });
    const result = await promptInstall();
    toast.dismiss(loadingId);
    if (result === "accepted") {
      toast.success("App installed successfully", {
        description: "Open it from your home screen anytime.",
      });
      setOpen(false);
    } else if (result === "dismissed") {
      toast.info("Install cancelled", {
        description: "You can install manually from your browser menu anytime.",
      });
    }
  };

  const handleClose = () => {
    dismissForSession();
    setOpen(false);
  };

  if (!canInstall && !showIOSHint) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <SheetContent
        side="bottom"
        className="rounded-t-[2.5rem] border-t-0 p-0 max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 pt-4 pb-8">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-primary/30 rounded-[28px] blur-2xl scale-110" />
              <div className="relative w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.5)] ring-1 ring-border">
                <img
                  src={logo}
                  alt="MUFFIGOUT APPAREL HUB"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>

            <h3 className="font-display font-bold text-2xl tracking-tight">
              MUFFIGOUT APPAREL HUB
            </h3>
            <p className="text-xs text-primary font-bold tracking-[0.25em] uppercase mt-1">
              Trendy Men's Outfit
            </p>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              Install the app for a faster, full-screen shopping experience.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <Feature icon={<Zap className="w-4 h-4" />} label="Faster" />
            <Feature icon={<Bell className="w-4 h-4" />} label="Order alerts" />
            <Feature icon={<Sparkles className="w-4 h-4" />} label="App-only drops" />
          </div>

          {canInstall ? (
            <div className="mt-7 space-y-2">
              <Button
                onClick={handleInstall}
                className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/20"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full h-11 rounded-full text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          ) : (
            <div className="mt-7">
              <div className="bg-secondary/50 rounded-2xl p-4 text-sm space-y-3">
                <p className="font-semibold text-foreground text-center">
                  Add to your Home Screen
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Tap the <span className="font-semibold text-foreground">Share</span> icon in Safari
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Choose <span className="font-semibold text-foreground">Add to Home Screen</span>
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full h-11 rounded-full text-muted-foreground mt-3"
              >
                Got it
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Feature = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="bg-secondary/40 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5">
    <div className="text-primary">{icon}</div>
    <span className="text-[10px] font-semibold text-foreground tracking-wide">
      {label}
    </span>
  </div>
);

export default InstallAppPrompt;
