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

const DelhiveryTracking = ({ waybill }: DelhiveryTrackingProps) => {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Fetching live tracking from Delhivery...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-destructive mb-4">
          <AlertCircle size={20} />
          <span className="font-medium">Tracking unavailable</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTracking}>
          <RefreshCw size={14} className="mr-1" /> Retry
        </Button>
      </div>
    );
  }

  if (!tracking) return null;

  const shipment = tracking.Shipment;
  const scans = shipment.Scans?.map(s => s.ScanDetail).reverse() || [];
  const currentStatus = shipment.Status;

  const getStatusIcon = (statusType: string) => {
    switch (statusType?.toUpperCase()) {
      case 'DL': return CheckCircle2;
      case 'OT': return Truck;
      case 'OD': return MapPin;
      case 'PU': return Package;
      default: return Clock;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType?.toUpperCase()) {
      case 'DL': return 'bg-green-100 text-green-800';
      case 'RT': return 'bg-red-100 text-red-800';
      case 'OD': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const StatusIcon = getStatusIcon(currentStatus.StatusType);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden mb-8">
      {/* Current Status Header */}
      <div className="bg-primary/5 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StatusIcon size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{currentStatus.Status}</h2>
              <p className="text-sm text-muted-foreground">{currentStatus.StatusLocation}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchTracking}>
            <RefreshCw size={16} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant="secondary" className={getStatusColor(currentStatus.StatusType)}>
            {currentStatus.StatusType === 'DL' ? 'Delivered' :
             currentStatus.StatusType === 'OD' ? 'Out for Delivery' :
             currentStatus.StatusType === 'OT' ? 'In Transit' :
             currentStatus.StatusType === 'PU' ? 'Picked Up' :
             currentStatus.StatusType === 'RT' ? 'RTO' :
             currentStatus.Status}
          </Badge>
          {shipment.ExpectedDeliveryDate && currentStatus.StatusType !== 'DL' && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock size={14} /> EDD: {new Date(shipment.ExpectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <span className="text-muted-foreground font-mono text-xs">AWB: {waybill}</span>
        </div>

        {currentStatus.Instructions && (
          <p className="text-sm text-muted-foreground mt-2">{currentStatus.Instructions}</p>
        )}

        {/* Route Info */}
        {(shipment.Origin || shipment.Destination) && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            {shipment.Origin && <span>{shipment.Origin}</span>}
            {shipment.Origin && shipment.Destination && <span>→</span>}
            {shipment.Destination && <span>{shipment.Destination}</span>}
          </div>
        )}
      </div>

      {/* Scan History */}
      <div className="p-6">
        <h3 className="font-semibold mb-4">Shipment Journey ({scans.length} updates)</h3>
        <div className="relative space-y-0">
          {scans.map((scan, index) => {
            const isFirst = index === 0;
            const isLast = index === scans.length - 1;
            const ScanIcon = getStatusIcon(scan.StatusCode);

            return (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isFirst ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}>
                    <ScanIcon size={14} />
                  </div>
                  {!isLast && <div className="w-0.5 h-full min-h-[2rem] bg-border" />}
                </div>
                <div className={`pb-4 ${isFirst ? '' : 'opacity-75'}`}>
                  <p className={`text-sm ${isFirst ? 'font-semibold' : 'font-medium'}`}>{scan.Scan || scan.Instructions}</p>
                  <p className="text-xs text-muted-foreground">
                    {scan.ScannedLocation} · {new Date(scan.ScanDateTime || scan.StatusDateTime).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DelhiveryTracking;
