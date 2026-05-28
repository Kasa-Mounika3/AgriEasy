import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocationData, getStoredLocation, detectUserLocation } from '@/lib/locationService';
import { toast } from 'sonner';

interface LocationContextType {
  location: LocationData;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
  updateLocation: (newLoc: LocationData) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationData>(() => {
    return getStoredLocation() || {
      lat: 17.3850,
      lng: 78.4867,
      locality: 'Hyderabad',
      city: 'Hyderabad',
      district: 'Hyderabad',
      state: 'Telangana'
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshLocation = async () => {
    setIsLoading(true);
    try {
      const detected = await detectUserLocation();
      setLocation(detected);
      if (detected.isCustom) {
        toast.success(`Location updated: ${detected.locality || detected.city}, ${detected.state}`);
      } else {
        toast.info("Using default location (Hyderabad)");
      }
    } catch (error) {
      toast.error("Could not detect location. Using fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = (newLoc: LocationData) => {
    setLocation(newLoc);
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, isLoading, refreshLocation, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
