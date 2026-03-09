import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation, Loader2, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Fix for default marker icon in Leaflet with Vite
// (using CDN for marker assets so it works reliably in Vite builds)
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

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

const MapPicker = ({ open, onClose, onLocationSelect }: MapPickerProps) => {
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [position, setPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const zoom = 15;

  const mapAttribution = useMemo(
    () => '© OpenStreetMap contributors',
    []
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Init / destroy Leaflet map
  useEffect(() => {
    if (!open) return;
    if (!mapDivRef.current) return;

    // Prevent double-init
    if (mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(position, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: mapAttribution,
      maxZoom: 19,
    }).addTo(map);

    // Attribution (kept minimal)
    L.control
      .attribution({ prefix: false, position: 'bottomright' })
      .addTo(map)
      .addAttribution(mapAttribution);

    const marker = L.marker(position, { draggable: true }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
    });

    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      setPosition([ll.lat, ll.lng]);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Force layout calculation after mount (Radix dialog animation can cause 0-size)
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // ignore
      }
    }, 200);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup when closing
  useEffect(() => {
    if (open) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [open]);

  // Keep map/marker in sync with position
  useEffect(() => {
    if (!open) return;
    if (!mapRef.current || !markerRef.current) return;

    markerRef.current.setLatLng(position);
    mapRef.current.setView(position, mapRef.current.getZoom(), { animate: true });
  }, [position, open]);

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
          address:
            [addr.road, addr.neighbourhood, addr.suburb]
              .filter(Boolean)
              .join(', ') ||
            data.display_name?.split(',').slice(0, 2).join(',') ||
            '',
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

  // Autocomplete search (overlay dropdown)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=in`
        );
        const results = (await res.json()) as SearchResult[];
        setSearchResults(results);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSelectResult = (result: SearchResult) => {
    setPosition([parseFloat(result.lat), parseFloat(result.lon)]);
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(', '));
    setShowResults(false);
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (!locationData) return;
    onLocationSelect(locationData);
    onClose();
  };

  // Auto-locate on open
  useEffect(() => {
    if (open) handleGetCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden h-[85vh] flex flex-col">
        {/* Header with search */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X size={18} />
            </Button>
            <h2 className="font-semibold">Select Your Location</h2>
          </div>

          {/* Plain textbox + dropdown */}
          <div ref={searchWrapRef} className="relative">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search an area or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="w-full h-11 pl-10 pr-10 border border-border rounded-lg bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {isSearching && (
                <Loader2
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
                />
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[2000] max-h-60 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.place_id}
                    onClick={() => handleSelectResult(r)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
                  >
                    <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapDivRef} className="h-full w-full" />

          {/* Current location */}
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

          {/* Hint */}
          <div className="absolute top-4 left-4 right-16 z-[1000]">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
              <MapPin size={14} className="inline mr-1.5 text-primary" />
              Tap on map or drag marker to select exact location
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Delivery Location
            </p>
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
