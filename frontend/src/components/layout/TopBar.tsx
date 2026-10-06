'use client';

import { MapPin, Bell, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TopBar() {
  const [address, setAddress] = useState('Loading...');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setAddress(user.address || 'Pickup from Store');
    } else {
      setAddress('Pickup from Store');
    }
  }, []);

  return (
    <div className="bg-white px-4 py-3 sticky top-0 z-40 border-b border-gray-100 pb-safe-top">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">
            Delivering to
          </p>
          <div className="flex items-center text-gray-900 cursor-pointer group active:scale-95 transition-transform">
            <MapPin size={16} className="text-green-600 mr-1 flex-shrink-0" />
            <span className="font-semibold text-sm truncate">{address}</span>
            <ChevronDown size={16} className="ml-1 text-gray-500 group-hover:text-gray-900 flex-shrink-0" />
          </div>
        </div>
        
        <button className="relative p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all flex-shrink-0">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
}
