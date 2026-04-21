import { useState, useEffect } from 'react';
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
}

/* ── Meesho-style status detection ─────────────────────────── */
// Identifies "milestone" scans that should render as a pill badge
// instead of a plain text row, matching the screenshots provided.
const MILESTONE_KEYWORDS: { match: RegExp; label: string }[] = [
  { match: /manifested|order placed|pickup scheduled/i, label: 'Order Placed' },
  { match: /picked up|pickup done|pickup complete/i, label: 'Picked Up' },
  { match: /in[-\s]?transit|dispatched|bag added|shipped/i, label: 'Shipped' },
  { match: /out for delivery/i, label: 'Out for Delivery' },
  { match: /delivered/i, label: 'Delivered' },
  { match: /rto|return to origin/i, label: 'Return to Origin' },
  { match: /undelivered|delivery attempt failed/i, label: 'Delivery Attempted' },
];

const detectMilestone = (scan: TrackingScan): string | null => {
  const haystack = `${scan.Scan || ''} ${scan.Instructions || ''} ${scan.ScanType || ''}`;
  for (const { match, label } of MILESTONE_KEYWORDS) {
    if (match.test(haystack)) return label;
  }
  return null;
};

const formatDayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

const DelhiveryTracking = ({ waybill }: DelhiveryTrackingProps) => {
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

  // Initial load + auto-poll every 60s for live updates without manual refresh.
  // Pauses while the tab is hidden to save bandwidth, resumes on visibility.
  useEffect(() => {
    if (!waybill) return;
    fetchTracking();
    let interval = window.setInterval(() => {
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
  }, [waybill]);


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
          <Button variant="outline" size="sm" onClick={fetchTracking} className="rounded-full">
            <RefreshCw size={14} className="mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  const shipment = tracking.Shipment;
  // Delhivery returns scans oldest first; reverse so newest sits at the TOP
  // (matches Meesho's "See all updates" view).
  const scans = (shipment.Scans?.map(s => s.ScanDetail) || []).slice().reverse();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
      {/* Header — courier + tracking ID + share */}
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
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={fetchTracking} aria-label="Refresh">
            <RefreshCw size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleShare} aria-label="Share">
            <Share2 size={16} />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-5">
        {scans.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No scan updates yet. Your shipment is being processed.
            </p>
          </div>
        ) : (
          <ol className="relative">
            {scans.map((scan, idx) => {
              const isLast = idx === scans.length - 1;
              const milestone = detectMilestone(scan);
              const dateTime = scan.ScanDateTime || scan.StatusDateTime;
              const dateLabel = formatDayMonth(dateTime);
              const timeLabel = formatTime(dateTime);
              const isDelivered = milestone === 'Delivered';

              return (
                <li key={idx} className="grid grid-cols-[3.25rem_1.5rem_1fr] gap-x-3 items-start">
                  {/* Date column */}
                  <div className="pt-0.5 text-xs text-muted-foreground font-medium tabular-nums text-right">
                    {dateLabel}
                  </div>

                  {/* Timeline rail */}
                  <div className="flex flex-col items-center self-stretch">
                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0 text-white">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 min-h-[1.75rem] bg-success/60 my-0.5" />}
                  </div>

                  {/* Content */}
                  <div className={`pb-5 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                    {milestone ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          isDelivered
                            ? 'bg-success/15 text-success'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {milestone}
                      </span>
                    ) : (
                      <p className="text-sm text-foreground leading-snug">
                        {scan.Instructions || scan.Scan}
                        {scan.ScannedLocation && !/(at|reached)/i.test(scan.Instructions || scan.Scan || '') && (
                          <> at <span className="font-medium">{scan.ScannedLocation}</span></>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{timeLabel}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Auto-sync footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Auto-syncs every 30 minutes
        </p>
        {shipment.ExpectedDeliveryDate && (
          <p className="text-[10px] text-muted-foreground">
            Expected: <span className="font-medium text-foreground">{formatDayMonth(shipment.ExpectedDeliveryDate)}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default DelhiveryTracking;
