import { useState } from 'react';
import { MapPin, CheckCircle2, XCircle, Clock, Loader2, Truck, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkPincodeDelivery } from '@/lib/pincodeChecker';
import { fetchCityStateFromPincode } from '@/data/indianStates';

interface PincodeCheckerProps {
  onDeliveryInfo?: (info: { estimatedDays: string; zone: string } | null) => void;
  pincode?: string;
}

interface CheckResult {
  delivery: ReturnType<typeof checkPincodeDelivery>;
  city?: string;
  state?: string;
  notFound?: boolean;
}

const PincodeChecker = ({ onDeliveryInfo, pincode: externalPincode }: PincodeCheckerProps) => {
  const [pincode, setPincode] = useState(externalPincode || '');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (pincode.length !== 6) return;
    setLoading(true);
    const delivery = checkPincodeDelivery(pincode);
    let city = '';
    let state = '';
    let notFound = false;
    try {
      const loc = await fetchCityStateFromPincode(pincode);
      if (loc) {
        city = loc.city;
        state = loc.state;
      } else {
        notFound = true;
      }
    } catch {
      notFound = true;
    }
    setResult({ delivery, city, state, notFound });
    setLoading(false);
    if (delivery.available && !notFound) {
      onDeliveryInfo?.({ estimatedDays: delivery.estimatedDays, zone: delivery.zone });
    } else {
      onDeliveryInfo?.(null);
    }
  };

  const reset = () => {
    setResult(null);
    onDeliveryInfo?.(null);
  };

  const showSuccess = result && result.delivery.available && !result.notFound;
  const showError = result && (!result.delivery.available || result.notFound);

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
              if (val.length < 6) reset();
            }}
            placeholder="Enter 6-digit pincode"
            className="pl-9"
            maxLength={6}
            inputMode="numeric"
            onKeyDown={(e) => { if (e.key === 'Enter' && pincode.length === 6) handleCheck(); }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleCheck}
          disabled={pincode.length !== 6 || loading}
          className="shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
        </Button>
      </div>

      {showSuccess && result && (
        <div className="rounded-lg p-3 text-sm space-y-2 bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 text-success font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Delivery available
            {result.city && result.state && (
              <span className="text-foreground font-normal">
                to {result.city}, {result.state}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{result.delivery.zone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{result.delivery.estimatedDays} business days</span>
            </div>
            <div className="flex items-center gap-1.5">
              {result.delivery.codAvailable ? (
                <>
                  <Banknote className="h-3.5 w-3.5" />
                  <span>COD available</span>
                </>
              ) : (
                <>
                  <Truck className="h-3.5 w-3.5" />
                  <span>Prepaid only</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showError && result && (
        <div className="rounded-lg p-3 text-sm bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <XCircle className="h-4 w-4" />
            {result.notFound
              ? 'Invalid pincode. Please check and try again.'
              : 'Sorry, we don\'t deliver to this pincode yet.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PincodeChecker;
