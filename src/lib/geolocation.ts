// Reusable geolocation + reverse geocoding helper using Nominatim (no API key required).

export interface DetectedLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export const detectCurrentLocation = (): Promise<DetectedLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          );
          if (!res.ok) {
            reject(new Error('Could not look up your address from this location.'));
            return;
          }
          const data = await res.json();
          const addr = data.address || {};
          resolve({
            address:
              [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ') ||
              data.display_name?.split(',').slice(0, 2).join(',') ||
              '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
          });
        } catch {
          reject(new Error('Could not look up your address from this location.'));
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location access was denied. Please enable location permissions and try again.'));
        } else {
          reject(new Error('We could not detect your location. Please try again.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
};
