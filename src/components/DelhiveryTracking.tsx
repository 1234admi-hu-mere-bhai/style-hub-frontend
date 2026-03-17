import { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Loader2,
  RefreshCw,
  AlertCircle,
  Clock,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TrackingScan {
  ScanDateTime: string;
  ScanType: string;
  Scan: string;
  StatusDateTime: string;
  ScannedLocation: string;
  Instructions: string;
  StatusCode: string;
}

interface TrackingData {
  Shipment: {
    Status: {
      Status: string;
      StatusLocation: string;
      StatusDateTime: string;
      StatusType: string;
      StatusCode: string;
      Instructions: string;
    };
    Scans: { ScanDetail: TrackingScan }[];
    PickUpDate: string;
    DestinationReceivedDate: string;
    ExpectedDeliveryDate: string;
    Destination: string;
    Origin: string;
    ChargedWeight: number;
    ReferenceNo: string;
    OrderType: string;
  };
}

interface DelhiveryTrackingProps {
  waybill: string;
}

const PROGRESS_STEPS = [
  { key: 'PU', label: 'Picked Up', icon: Package },
  { key: 'OT', label: 'In Transit', icon: Truck },
  { key: 'OD', label: 'Out for Delivery', icon: MapPin },
  { key: 'DL', label: 'Delivered', icon: CheckCircle2 },
];

const getProgressIndex = (statusType: string) => {
  const map: Record<string, number> = { PU: 0, OT: 1, OD: 2, DL: 3, RT: -1 };
  return map[statusType?.toUpperCase()] ?? 1;
};

const DelhiveryTracking = ({ waybill }: DelhiveryTrackingProps) => {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllScans, setShowAllScans] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTracking = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('delhivery', {
        body: { action: 'track', waybill },
      });

      if (fnError) throw fnError;

      if (data?.ShipmentData?.[0]) {
        setTracking(data.ShipmentData[0]);
        setLastRefresh(new Date());
      } else if (data?.Error) {
        setError(data.Error);
      } else {
        setError('No tracking data found for this AWB number');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (waybill) fetchTracking();
  }, [waybill]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-muted-foreground mt-4 font-medium">Fetching live tracking...</p>
        <p className="text-xs text-muted-foreground/60 mt-1">AWB: {waybill}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Tracking Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTracking} className="rounded-full">
            <RefreshCw size={14} className="mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  const shipment = tracking.Shipment;
  const scans = shipment.Scans?.map(s => s.ScanDetail).reverse() || [];
  const currentStatus = shipment.Status;
  const isRTO = currentStatus.StatusType?.toUpperCase() === 'RT';
  const progressIndex = getProgressIndex(currentStatus.StatusType);
  const isDelivered = currentStatus.StatusType?.toUpperCase() === 'DL';
  const visibleScans = showAllScans ? scans : scans.slice(0, 4);

  return (
    <div className="space-y-4 mb-8">
      {/* Live Status Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Header with live badge */}
        <div className={`px-6 py-5 ${isDelivered ? 'bg-success/5' : isRTO ? 'bg-destructive/5' : 'bg-primary/5'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDelivered ? 'bg-success/15 text-success' : isRTO ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'
              }`}>
                {isDelivered ? <CheckCircle2 size={24} /> : isRTO ? <AlertCircle size={24} /> : <Truck size={24} />}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg leading-tight">{currentStatus.Status}</h2>
                <p className="text-sm text-muted-foreground truncate">{currentStatus.StatusLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="gap-1.5 text-[10px] font-semibold uppercase tracking-wider border-primary/30 text-primary bg-primary/5">
                <Radio size={8} className="animate-pulse" /> Live
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchTracking}>
                <RefreshCw size={14} />
              </Button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            <span className="font-mono">AWB: {waybill}</span>
            {shipment.ExpectedDeliveryDate && !isDelivered && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Expected: {new Date(shipment.ExpectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {shipment.Origin && shipment.Destination && (
              <span>{shipment.Origin} → {shipment.Destination}</span>
            )}
            {lastRefresh && (
              <span>Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>

          {currentStatus.Instructions && (
            <p className="text-sm text-muted-foreground mt-2 bg-background/50 rounded-lg px-3 py-2">
              {currentStatus.Instructions}
            </p>
          )}
        </div>

        {/* Progress Stepper */}
        {!isRTO && (
          <div className="px-6 py-5 border-t border-border">
            <div className="flex items-center justify-between relative">
              {/* Background line */}
              <div className="absolute top-5 left-6 right-6 h-0.5 bg-border" />
              {/* Progress line */}
              <div
                className="absolute top-5 left-6 h-0.5 bg-primary transition-all duration-700 ease-out"
                style={{ width: `calc(${(Math.max(0, progressIndex) / (PROGRESS_STEPS.length - 1)) * 100}% - 48px)` }}
              />

              {PROGRESS_STEPS.map((step, idx) => {
                const isCompleted = idx <= progressIndex;
                const isCurrent = idx === progressIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center z-10 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted
                        ? isCurrent
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
                          : 'bg-primary text-primary-foreground'
                        : 'bg-card border-2 border-border text-muted-foreground'
                    }`}>
                      <StepIcon size={18} />
                    </div>
                    <span className={`text-[10px] mt-2 font-medium text-center leading-tight max-w-[60px] ${
                      isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RTO Warning */}
        {isRTO && (
          <div className="mx-6 my-4 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-destructive">Return to Origin (RTO)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your shipment is being returned to the sender.</p>
          </div>
        )}
      </div>

      {/* Scan History Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Shipment Journey</h3>
          <Badge variant="secondary" className="text-xs">{scans.length} updates</Badge>
        </div>

        <div className="px-6 py-4">
          <div className="relative">
            {visibleScans.map((scan, index) => {
              const isFirst = index === 0;
              const isLast = index === visibleScans.length - 1 && (showAllScans || scans.length <= 4);

              return (
                <div key={index} className="flex gap-4 group">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 transition-colors ${
                      isFirst
                        ? 'bg-primary ring-4 ring-primary/20'
                        : 'bg-border group-hover:bg-muted-foreground'
                    }`} />
                    {!(isLast) && (
                      <div className="w-px flex-1 min-h-[2rem] bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-5 flex-1 min-w-0 ${isFirst ? '' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                    <p className={`text-sm leading-snug ${isFirst ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {scan.Scan || scan.Instructions}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{scan.ScannedLocation}</span>
                      <span className="text-xs text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(scan.ScanDateTime || scan.StatusDateTime).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {scans.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAllScans(!showAllScans)}
            >
              {showAllScans ? (
                <><ChevronUp size={14} className="mr-1" /> Show less</>
              ) : (
                <><ChevronDown size={14} className="mr-1" /> Show all {scans.length} updates</>
              )}
            </Button>
          )}
        </div>

        {/* Auto-sync footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Status auto-syncs every 30 minutes
          </p>
          {lastRefresh && (
            <p className="text-[10px] text-muted-foreground">
              Last checked: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DelhiveryTracking;
