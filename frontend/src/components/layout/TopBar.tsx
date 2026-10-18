'use client';

import { MapPin, Bell, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/locationStore';

export function TopBar() {
  const { currentLocation, openMapPicker, setLocation } = useLocationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync with existing user address if locationStore not initialized with custom address
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.address && user.address !== 'Pickup from Store' && (!currentLocation?.address || currentLocation.address === 'Piața Unirii, Centru, Oradea')) {
          const lat = user.deliveryLocation?.lat || 47.0561;
          const lng = user.deliveryLocation?.lng || 21.9379;
          setLocation({
            address: user.address,
            lat,
            lng,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const displayAddress = mounted ? (currentLocation?.address || 'Piața Unirii, Oradea') : 'Oradea, România';

  return (
    <div className="bg-white px-4 py-3 sticky top-0 z-40 border-b border-gray-100 pb-safe-top">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div 
          onClick={openMapPicker}
          className="flex-1 min-w-0 pr-4 cursor-pointer group select-none"
        >
          <div className="flex items-center space-x-1 mb-0.5">
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
              Delivering to
            </span>
            <span className="text-[9px] font-semibold bg-green-100 text-green-800 px-1.5 py-0.2 rounded">
              Oradea
            </span>
          </div>
          <div className="flex items-center text-gray-900 group-hover:text-green-700 transition-colors">
            <MapPin size={16} className="text-green-600 mr-1 flex-shrink-0 animate-bounce" />
            <span className="font-semibold text-sm truncate">{displayAddress}</span>
            <ChevronDown size={16} className="ml-1 text-gray-400 group-hover:text-green-600 flex-shrink-0 transition-transform group-hover:translate-y-0.5" />
          </div>
        </div>
        
        <button 
          onClick={openMapPicker}
          title="Selectează locația pe hartă"
          className="relative p-2 bg-green-50 rounded-full text-green-700 hover:bg-green-100 active:scale-95 transition-all flex-shrink-0 border border-green-200"
        >
          <MapPin size={18} />
        </button>
      </div>
    </div>
  );
}
