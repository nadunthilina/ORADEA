import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isPointInOradea, ORADEA_CENTER } from '@/data/oradeaBoundary';

export interface DeliveryLocation {
  address: string;
  lat: number;
  lng: number;
  details?: string;
  isValidInOradea: boolean;
}

interface LocationState {
  currentLocation: DeliveryLocation;
  isMapPickerOpen: boolean;
  setLocation: (location: Partial<DeliveryLocation> & { lat: number; lng: number; address: string }) => void;
  openMapPicker: () => void;
  closeMapPicker: () => void;
}

const DEFAULT_ORADEA_LOCATION: DeliveryLocation = {
  address: 'Piața Unirii, Centru, Oradea',
  lat: ORADEA_CENTER.lat,
  lng: ORADEA_CENTER.lng,
  details: '',
  isValidInOradea: true,
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentLocation: DEFAULT_ORADEA_LOCATION,
      isMapPickerOpen: false,
      setLocation: (loc) => {
        const valid = isPointInOradea(loc.lat, loc.lng);
        const updated: DeliveryLocation = {
          address: loc.address,
          lat: loc.lat,
          lng: loc.lng,
          details: loc.details || '',
          isValidInOradea: valid,
        };

        // Also update user address in localStorage if user is logged in
        if (typeof window !== 'undefined') {
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              user.address = loc.address;
              user.deliveryLocation = { lat: loc.lat, lng: loc.lng };
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (e) {
            console.error('Error updating localStorage user address:', e);
          }
        }

        set({ currentLocation: updated });
      },
      openMapPicker: () => set({ isMapPickerOpen: true }),
      closeMapPicker: () => set({ isMapPickerOpen: false }),
    }),
    {
      name: 'foods-oradea-location',
    }
  )
);
