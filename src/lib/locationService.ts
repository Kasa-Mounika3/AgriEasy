/**
 * locationService.ts
 * Robust location detection with fallback to Hyderabad, Telangana
 */

export interface LocationData {
  lat: number;
  lng: number;
  locality: string;
  city: string;
  district: string;
  state: string;
  pincode?: string;
  isCustom?: boolean;
}

const DEFAULT_LOCATION: LocationData = {
  lat: 17.3850,
  lng: 78.4867,
  locality: 'Hyderabad',
  city: 'Hyderabad',
  district: 'Hyderabad',
  state: 'Telangana',
  isCustom: false
};

const LOCATION_CACHE_KEY = 'agrieasy_user_location';

/**
 * Persist location data to local storage
 */
export const setStoredLocation = (data: LocationData) => {
  localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data));
};

/**
 * Retrieve location data from local storage
 */
export const getStoredLocation = (): LocationData | null => {
  const stored = localStorage.getItem(LOCATION_CACHE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

/**
 * Reverse Geocodes Lat/Lng to readable address using Nominatim (OSM)
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<Partial<LocationData>> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US'
        }
      }
    );
    const data = await response.json();
    
    if (data.address) {
      const addr = data.address;
      
      // Locality fallback chain: suburb, neighborhood, village, hamlet, town, city, county
      const locality = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || addr.town || addr.city || addr.county || '';
      
      // City fallback chain
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.suburb || '';
      
      // District fallback chain
      const district = addr.county || addr.district || addr.state_district || addr.city_district || addr.city || '';
      
      // State
      const state = addr.state || '';

      const pincode = addr.postcode;

      return {
        locality: locality || city || district || 'Hyderabad',
        city: city || district || 'Hyderabad',
        district: district || city || 'Hyderabad',
        state: state || 'Telangana',
        pincode: pincode
      };
    }
  } catch (error) {
    console.error('Reverse Geocoding error:', error);
  }
  return {};
};

/**
 * Detects location using browser API and reverse geocodes it
 */
export const detectUserLocation = (): Promise<LocationData> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      resolve(DEFAULT_LOCATION);
      return;
    }

    // Set a safety timeout for the entire process
    const safetyTimeout = setTimeout(() => {
      console.warn('Location detection timed out (overall)');
      const stored = getStoredLocation();
      resolve(stored || DEFAULT_LOCATION);
    }, 6000); // 1s more than geolocation timeout

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let geoInfo: Partial<LocationData> = {};
        try {
          // Add a timeout to the fetch request as well
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 3000);
          
          geoInfo = await reverseGeocode(latitude, longitude);
          clearTimeout(id);
        } catch (e) {
          console.warn('Reverse geocoding failed, using coordinates only');
        }

        const loc: LocationData = {
          lat: latitude,
          lng: longitude,
          locality: geoInfo.locality || DEFAULT_LOCATION.locality,
          city: geoInfo.city || DEFAULT_LOCATION.city,
          district: geoInfo.district || DEFAULT_LOCATION.district,
          state: geoInfo.state || DEFAULT_LOCATION.state,
          pincode: geoInfo.pincode,
          isCustom: true
        };
        
        clearTimeout(safetyTimeout);
        setStoredLocation(loc);
        resolve(loc);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        clearTimeout(safetyTimeout);
        const stored = getStoredLocation();
        resolve(stored || DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

/**
 * Calculates the Haversine distance between two points in km
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat1 - lat2) * Math.PI / 180;
  const dLon = (lon1 - lon2) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
