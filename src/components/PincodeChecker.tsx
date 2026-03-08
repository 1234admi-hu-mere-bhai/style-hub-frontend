import { useState } from 'react';
import { MapPin, CheckCircle2, XCircle, Truck, Clock, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkPincodeDelivery } from '@/lib/pincodeChecker';

interface PincodeCheckerProps {
  onDeliveryInfo?: (info: { estimatedDays: string; zone: string } | null) => void;
  pincode?: string;
}

const PincodeChecker = ({ onDeliveryInfo, pincode: externalPincode }: PincodeCheckerProps) => {
  const [pincode, setPincode] = useState(externalPincode || '');
  const [result, setResult] = useState<ReturnType<typeof checkPincodeDelivery> | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    const info = checkPincodeDelivery(pincode);
    setResult(info);
    setChecked(true);
    if (info.available) {
      onDeliveryInfo?.({ estimatedDays: info.estimatedDays, zone: info.zone });
    } else {
      onDeliveryInfo?.(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(val);
              if (val.length < 6) { setChecked(false); setResult(null); onDeliveryInfo?.(null); }
            }}
            placeholder="Enter 6-digit pincode"
            className="pl-9"
            maxLength={6}
            onKeyDown={(e) => { if (e.key === 'Enter' && pincode.length === 6) handleCheck(); }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleCheck}
          disabled={pincode.length !== 6}
          className="shrink-0"
        >
          Check
        </Button>
      </div>

      {checked && result && (
        <div className={`rounded-lg p-3 text-sm space-y-2 ${result.available ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
          {result.available ? (
            <>
              <div className="flex items-center gap-2 text-success font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Delivery available to {pincode}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{result.zone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{result.estimatedDays} business days</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-destructive font-medium">
              <XCircle className="h-4 w-4" />
              Please enter a valid 6-digit pincode
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PincodeChecker;
