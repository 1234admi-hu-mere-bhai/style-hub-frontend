import { useState } from 'react';
import { MapPin, ChevronRight, Plus, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAddress } from '@/contexts/ActiveAddressContext';
import { useAddresses } from '@/hooks/useAddresses';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCityStateFromPincode } from '@/data/indianStates';

const MobileDeliveryStrip = () => {
  const { user } = useAuth();
  const { addresses } = useAddresses();
  const { active, setActive, setActiveFromAddressId } = useActiveAddress();
  const [open, setOpen] = useState(false);
  const [manualPin, setManualPin] = useState('');
  const [checking, setChecking] = useState(false);

  const handleManualPincode = async () => {
    if (manualPin.length !== 6) return;
    setChecking(true);
    try {
      const loc = await fetchCityStateFromPincode(manualPin);
      setActive({
        pincode: manualPin,
        city: loc?.city || '',
        state: loc?.state || '',
      });
      setManualPin('');
      setOpen(false);
    } finally {
      setChecking(false);
    }
  };

  const handlePickAddress = (id: string) => {
    setActiveFromAddressId(id);
    setOpen(false);
  };

  const label = active
    ? `Delivering to ${active.city || 'your area'}${active.pincode ? ' - ' + active.pincode : ''}`
    : 'Set delivery location';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="md:hidden w-full flex items-center gap-2 px-4 py-2.5 bg-secondary/40 border-b border-border text-left active:bg-secondary/60 transition-colors"
        >
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground truncate flex-1">{label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Select delivery location</SheetTitle>
        </SheetHeader>

        {user && addresses.length > 0 && (
          <div className="space-y-2 mb-4">
            {addresses.map((addr) => {
              const isActive = active?.addressId === addr.id ||
                (!active?.addressId && active?.pincode === addr.pincode);
              return (
                <button
                  key={addr.id}
                  onClick={() => handlePickAddress(addr.id)}
                  className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                    isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40'
                  }`}
                >
                  <MapPin className={`h-5 w-5 mt-0.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        <Link
          to="/profile"
          onClick={() => setOpen(false)}
          className="w-full flex items-center gap-2 rounded-xl border border-dashed border-border p-3 mb-4 hover:bg-secondary/40 transition-colors"
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            {user ? 'Add a new address' : 'Sign in to save addresses'}
          </span>
        </Link>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">Or enter a pincode</p>
          <div className="flex gap-2">
            <Input
              value={manualPin}
              onChange={(e) => setManualPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit pincode"
              inputMode="numeric"
              maxLength={6}
            />
            <Button
              onClick={handleManualPincode}
              disabled={manualPin.length !== 6 || checking}
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileDeliveryStrip;
