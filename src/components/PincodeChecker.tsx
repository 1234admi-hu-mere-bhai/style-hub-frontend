import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, XCircle, Clock, Loader2, ChevronDown, ChevronUp, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkPincodeDelivery } from '@/lib/pincodeChecker';
import { fetchCityStateFromPincode } from '@/data/indianStates';
import { supabase } from '@/integrations/supabase/client';
import { useAddresses } from '@/hooks/useAddresses';

interface PincodeCheckerProps {
  onDeliveryInfo?: (info: { estimatedDays: string; zone: string } | null) => void;
  pincode?: string;
}

interface DeliveryShape {
  available: boolean;
  zone: string;
  estimatedDays: string;
  codAvailable: boolean;
  expectedDate?: string;
}

interface CheckResult {
  delivery: DeliveryShape;
  city?: string;
  state?: string;
  notFound?: boolean;
  checkedPincode: string;
}

const formatExpectedDate = (tatDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + tatDays);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const PincodeChecker = ({ onDeliveryInfo, pincode: externalPincode }: PincodeCheckerProps) => {
  const [pincode, setPincode] = useState(externalPincode || '');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const { addresses, getDefaultAddress, loading: addressesLoading } = useAddresses();
  const { active } = useActiveAddress();
  const lastAutoPinRef = useRef<string | null>(null);

  const runCheck = useCallback(async (pin: string) => {
    if (!pin || pin.length !== 6) return;
    setLoading(true);

    let delivery: DeliveryShape;
    let city = '';
    let state = '';
    let notFound = false;

    try {
      const { data, error } = await supabase.functions.invoke('delhivery', {
        body: { action: 'estimate_delivery', pincode: pin },
      });
      if (error) throw error;
      if (data && data.serviceable) {
        delivery = {
          available: true,
          zone: data.zone || 'Delhivery Network',
          estimatedDays: data.estimatedDays || (data.tatDays ? String(data.tatDays) : '5–7'),
          codAvailable: !!data.codAvailable,
          expectedDate: data.tatDays ? formatExpectedDate(Number(data.tatDays)) : undefined,
        };
        if (data.city) city = data.city;
        if (data.state) state = data.state;
      } else if (data && data.serviceable === false) {
        delivery = { available: false, zone: '', estimatedDays: '', codAvailable: false };
      } else {
        throw new Error('no data');
      }
    } catch {
      delivery = checkPincodeDelivery(pin);
    }

    if (!city || !state) {
      try {
        const loc = await fetchCityStateFromPincode(pin);
        if (loc) {
          city = city || loc.city;
          state = state || loc.state;
        } else if (!city && !state) {
          notFound = true;
        }
      } catch {
        if (!city && !state) notFound = true;
      }
    }

    setResult({ delivery, city, state, notFound, checkedPincode: pin });
    setShowDetails(false);
    setLoading(false);
    if (delivery.available && !notFound) {
      onDeliveryInfo?.({ estimatedDays: delivery.estimatedDays, zone: delivery.zone });
    } else {
      onDeliveryInfo?.(null);
    }
  }, [onDeliveryInfo]);

  // Auto-fetch on mount when a default saved address exists
  useEffect(() => {
    if (autoCheckedRef.current) return;
    if (addressesLoading) return;
    if (pincode) return; // user already typed / external pincode provided
    const def = getDefaultAddress();
    if (def?.pincode && def.pincode.length === 6) {
      autoCheckedRef.current = true;
      setPincode(def.pincode);
      setAutoFilled(true);
      runCheck(def.pincode);
    }
  }, [addressesLoading, getDefaultAddress, pincode, runCheck]);

  const handleCheck = () => runCheck(pincode);

  const reset = () => {
    setResult(null);
    setShowDetails(false);
    setAutoFilled(false);
    onDeliveryInfo?.(null);
  };

  const handleChangeAddress = (newPin: string) => {
    setPincode(newPin);
    setAutoFilled(true);
    runCheck(newPin);
  };

  const showSuccess = result && result.delivery.available && !result.notFound;
  const showError = result && (!result.delivery.available || result.notFound);
  // Highlight Check button when input is ready but not yet checked
  const needsCheck = pincode.length === 6 && !loading && (!result || result.checkedPincode !== pincode);

  const otherAddresses = addresses.filter(
    (a) => a.pincode && a.pincode.length === 6 && a.pincode !== pincode,
  );

  return (
    <div className="space-y-3">
      {autoFilled && result && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">
            Delivering to <span className="font-medium text-foreground">{result.city || 'your address'}</span> · {pincode}
          </span>
          {otherAddresses.length > 0 ? (
            <select
              className="ml-2 bg-transparent text-primary font-medium underline-offset-2 hover:underline focus:outline-none"
              value={pincode}
              onChange={(e) => handleChangeAddress(e.target.value)}
            >
              <option value={pincode}>Change</option>
              {otherAddresses.map((a) => (
                <option key={a.id} value={a.pincode}>
                  {a.city} · {a.pincode}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => { reset(); setPincode(''); }}
              className="ml-2 text-primary font-medium hover:underline"
            >
              Change
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(val);
              setAutoFilled(false);
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
          variant={needsCheck ? 'default' : 'outline'}
          onClick={handleCheck}
          disabled={pincode.length !== 6 || loading}
          className={`shrink-0 ${needsCheck ? 'animate-pulse shadow-md shadow-primary/30' : ''}`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
        </Button>
      </div>

      {showSuccess && result && (
        <div className="rounded-lg p-3 text-sm bg-success/10 border border-success/20 space-y-2">
          <div className="flex items-start gap-2">
            <CalendarCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              {result.delivery.expectedDate ? (
                <>
                  <div className="text-foreground font-semibold">
                    Delivery by {result.delivery.expectedDate}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.city && result.state ? `to ${result.city}, ${result.state}` : 'Delivery available'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-foreground font-semibold">
                    Delivery in {result.delivery.estimatedDays} business days
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.city && result.state ? `to ${result.city}, ${result.state}` : 'Delivery available'}
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {showDetails ? 'Hide details' : 'Additional details'}
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-2 border-t border-success/20">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{result.delivery.zone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{result.delivery.estimatedDays} business days</span>
              </div>
            </div>
          )}
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
