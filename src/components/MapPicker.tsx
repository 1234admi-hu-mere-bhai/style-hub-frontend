import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation, Loader2, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Fix for default marker icon in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
    displayName: string;
  }) => void;
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  displayName: string;
}

// Component to handle map clicks and marker dragging
const DraggableMarker = ({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}) => {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const { lat, lng } = marker.getLatLng();
            setPosition([lat, lng]);
          }
        },
      }}
    />
  );
};

// Component to recenter map
const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapPicker = ({ open, onClose, onLocationSelect }: MapPickerProps) => {
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]); // Default: India center
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode when position changes
  useEffect(() => {
    if (!open) return;
    const reverseGeocode = async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&addressdetails=1`
        );
        const data = await res.json();
        const addr = data.address || {};
        setLocationData({
          lat: position[0],
          lng: position[1],
          address: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ') ||
            data.display_name?.split(',').slice(0, 2).join(',') || '',
          city: addr.city || addr.town || addr.village || addr.county || '',
          state: addr.state || '',
          pincode: addr.postcode || '',
          displayName: data.display_name || '',
        });
      } catch {
        setLocationData(null);
      } finally {
        setIsGeocoding(false);
      }
    };
    const timeout = setTimeout(reverseGeocode, 300);
    return () => clearTimeout(timeout);
  }, [position, open]);

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      () => {
        toast.error('Could not get your location. Please enable location permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await res.json();
      if (results.length > 0) {
        setPosition([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
      } else {
        toast.error('Location not found. Try a different search.');
      }
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (locationData) {
      onLocationSelect(locationData);
      onClose();
    }
  };

  // Get current location on open
  useEffect(() => {
    if (open) {
      handleGetCurrentLocation();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X size={18} />
            </Button>
            <h2 className="font-semibold">Select Your Location</h2>
          </div>
          
          {/* Search bar */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search an area or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} size="sm" className="h-10 px-4">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={position} setPosition={setPosition} />
            <RecenterMap center={position} />
          </MapContainer>

          {/* Current location button */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="absolute top-4 right-4 z-[1000] bg-card border border-border rounded-full p-3 shadow-lg hover:bg-secondary transition-colors"
          >
            {isLocating ? (
              <Loader2 size={20} className="animate-spin text-primary" />
            ) : (
              <Navigation size={20} className="text-primary" />
            )}
          </button>

          {/* Pin center indicator text */}
          <div className="absolute top-4 left-4 right-16 z-[1000]">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
              <MapPin size={14} className="inline mr-1.5 text-primary" />
              Tap on map or drag marker to select exact location
            </div>
          </div>
        </div>

        {/* Footer with location info */}
        <div className="p-4 border-t border-border bg-card">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Delivery Location</p>
            {isGeocoding ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Finding address...
              </div>
            ) : locationData ? (
              <div>
                <p className="font-medium text-sm">{locationData.city || 'Unknown Area'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {locationData.displayName || locationData.address}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a location on the map</p>
            )}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!locationData || isGeocoding}
            className="w-full"
            size="lg"
          >
            Confirm & Proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapPicker;
