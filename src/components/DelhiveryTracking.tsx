import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Truck,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  /** When true, auto-polling pauses (e.g. order is cancelled or delivered). */
  paused?: boolean;
}

/* ── Milestone definitions ─────────────────────────────────────
   Flipkart-style: 4 fixed stages on the rail. Each granular scan
   maps to ONE milestone and is rendered as an indented sub-event
   underneath the matching header. Future stages render hollow. */
type MilestoneKey = 'placed' | 'shipped' | 'out_for_delivery' | 'delivered';

interface MilestoneDef {
  key: MilestoneKey;
  label: string;
  match: RegExp;
}

const MILESTONES: MilestoneDef[] = [
  {
    key: 'placed',
    label: 'Order Confirmed',
    match: /manifested|order placed|pickup scheduled|picked up|pickup done|pickup complete|received at facility/i,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    match: /in[-\s]?transit|dispatched|bag added|shipped|arrived|departed|left|reached|connected|misroute|rto/i,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    match: /out for delivery|undelivered|delivery attempt/i,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    match: /^delivered$|delivered to|consignee/i,
  },
];

const classifyScan = (scan: TrackingScan): MilestoneKey => {
  const haystack = `${scan.Scan || ''} ${scan.Instructions || ''} ${scan.ScanType || ''}`;
  // Check from most-specific (delivered) backwards so a scan saying
  // "delivered" doesn't get caught by "shipped" rules.
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (MILESTONES[i].match.test(haystack)) return MILESTONES[i].key;
  }
  // Default: anything unrecognized falls into "shipped" (in-transit chatter)
  return 'shipped';
};

const formatDayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

const formatDayMonthShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

/** Strip noisy prefixes from Delhivery scan instructions for cleaner sentences. */
const cleanInstruction = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const DelhiveryTracking = ({ waybill, paused = false }: DelhiveryTrackingProps) => {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchTracking = async (silent = false) => {
    if (!silent) setIsLoading(true);
    if (!silent) setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('delhivery', {
        body: { action: 'track', waybill },
      });

      if (fnError) throw fnError;

      if (data?.ShipmentData?.[0]) {
        setTracking(data.ShipmentData[0]);
        setLastSync(new Date());
        if (silent) setError('');
      } else if (data?.Error) {
        if (!silent) setError(data.Error);
      } else {
        if (!silent) setError('No tracking data found for this AWB number');
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to fetch tracking data');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!waybill) return;
    fetchTracking();
    if (paused) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchTracking(true);
    }, 60000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchTracking(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waybill, paused]);

  const handleShare = async () => {
    const shareText = `Track my order: AWB ${waybill}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Order Tracking', text: shareText });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch { /* clipboard blocked */ }
    }
  };

  /* ── Group scans under milestone headers ──────────────────── */
  const grouped = useMemo(() => {
    if (!tracking) return null;
    const scans = (tracking.Shipment.Scans?.map(s => s.ScanDetail) || [])
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.ScanDateTime || a.StatusDateTime).getTime();
        const tb = new Date(b.ScanDateTime || b.StatusDateTime).getTime();
        return ta - tb; // oldest → newest (Flipkart order)
      });

    const buckets: Record<MilestoneKey, TrackingScan[]> = {
      placed: [],
      shipped: [],
      out_for_delivery: [],
      delivered: [],
    };
    for (const scan of scans) {
      buckets[classifyScan(scan)].push(scan);
    }
    return buckets;
  }, [tracking]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center py-16 mb-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Fetching live tracking…</p>
        <p className="text-xs text-muted-foreground/60 mt-1 font-mono">AWB: {waybill}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 mb-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Tracking Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchTracking()} className="rounded-full">
            <RefreshCw size={14} className="mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!tracking || !grouped) return null;

  const shipment = tracking.Shipment;

  // Determine reached state of each milestone (any scan present = reached).
  // Highest reached milestone determines what's "current".
  const reachedFlags: Record<MilestoneKey, boolean> = {
    placed: grouped.placed.length > 0,
    shipped: grouped.shipped.length > 0,
    out_for_delivery: grouped.out_for_delivery.length > 0,
    delivered: grouped.delivered.length > 0,
  };

  // The expected-delivery row is always shown last as a future placeholder
  // unless `delivered` is already true.
  const isDelivered = reachedFlags.delivered;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Courier: <span className="font-semibold text-foreground">Delhivery</span>
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tracking ID: <span className="font-bold text-foreground font-mono">{waybill}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => fetchTracking()} aria-label="Refresh">
            <RefreshCw size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleShare} aria-label="Share">
            <Share2 size={16} />
          </Button>
        </div>
      </div>

      {/* Milestone timeline */}
      <div className="px-5 py-5">
        {Object.values(reachedFlags).every(v => !v) ? (
          <div className="text-center py-8">
            <Truck size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No scan updates yet. Your shipment is being processed.
            </p>
          </div>
        ) : (
          <ol className="relative">
            {MILESTONES.map((milestone, mIdx) => {
              const reached = reachedFlags[milestone.key];
              const subEvents = grouped[milestone.key];
              const headerScan = subEvents[0]; // earliest scan = milestone reached time
              const isLastMilestone = mIdx === MILESTONES.length - 1;

              return (
                <li key={milestone.key} className="grid grid-cols-[1.5rem_1fr] gap-x-3">
                  {/* Rail */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 transition-colors ${
                        reached
                          ? 'bg-success ring-4 ring-success/20'
                          : 'bg-card border-2 border-muted-foreground/30'
                      }`}
                    />
                    {!isLastMilestone && (
                      <div
                        className={`w-0.5 flex-1 min-h-[2rem] my-1 ${
                          reached ? 'bg-success/60' : 'bg-muted-foreground/20'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-6 min-w-0">
                    {/* Milestone header */}
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h4
                        className={`font-bold text-sm ${
                          reached ? 'text-foreground' : 'text-muted-foreground/70'
                        }`}
                      >
                        {milestone.label}
                      </h4>
                      {reached && headerScan && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatDayMonth(headerScan.ScanDateTime || headerScan.StatusDateTime)}
                        </span>
                      )}
                    </div>

                    {/* Sub-events — only when reached */}
                    {reached && subEvents.length > 0 ? (
                      <div className="mt-2 space-y-2.5">
                        {/* Inline courier label under "Shipped" — Flipkart parity */}
                        {milestone.key === 'shipped' && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Delhivery — {waybill}
                          </p>
                        )}
                        {subEvents.map((scan, idx) => {
                          const dateTime = scan.ScanDateTime || scan.StatusDateTime;
                          const text = cleanInstruction(scan.Instructions || scan.Scan);
                          return (
                            <div key={idx} className="text-sm leading-snug">
                              <p className="text-foreground/90">{text}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDayMonthShort(dateTime)} · {formatTime(dateTime)}
                                {scan.ScannedLocation && (
                                  <>
                                    {' · '}
                                    <span className="font-medium text-foreground/80">
                                      {scan.ScannedLocation}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : !reached ? (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {milestone.key === 'delivered' && shipment.ExpectedDeliveryDate
                          ? `Expected by ${formatDayMonth(shipment.ExpectedDeliveryDate)}`
                          : 'Pending'}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}

            {/* Optional: explicit "Delivery Expected" pending row when not yet delivered */}
            {!isDelivered && shipment.ExpectedDeliveryDate && (
              <li className="grid grid-cols-[1.5rem_1fr] gap-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-card border-2 border-muted-foreground/30 mt-1" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-muted-foreground/70">
                    Delivery Expected By {formatDayMonthShort(shipment.ExpectedDeliveryDate)}
                  </h4>
                  <p className="text-xs text-muted-foreground/70 mt-1">Item yet to be delivered.</p>
                </div>
              </li>
            )}
          </ol>
        )}
      </div>

      {/* Auto-sync footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-muted-foreground' : 'bg-success animate-pulse'}`} />
          {paused
            ? `Auto-sync paused${lastSync ? ` · last synced ${formatTime(lastSync.toISOString())}` : ''}`
            : <>Live · auto-updates every minute{lastSync && ` · synced ${formatTime(lastSync.toISOString())}`}</>}
        </p>
        {shipment.ExpectedDeliveryDate && (
          <p className="text-[10px] text-muted-foreground">
            Expected: <span className="font-medium text-foreground">{formatDayMonthShort(shipment.ExpectedDeliveryDate)}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default DelhiveryTracking;
