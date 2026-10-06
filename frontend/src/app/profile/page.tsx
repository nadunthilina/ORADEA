'use client';

import { User, Settings, Heart, Clock, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const menuItems = [
    { icon: Clock, label: 'Order History', path: '/orders' },
    { icon: Heart, label: 'Favorites', path: '/favorites' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      <div className="bg-white px-4 py-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Guest User'}</h1>
            <p className="text-gray-500">{user?.email || 'Please sign in'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 mt-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                    <Icon size={20} />
                  </div>
                  <span className="font-semibold text-gray-900">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            );
          })}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-6 bg-white border border-red-200 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center shadow-sm active:scale-[0.98] transition-transform"
        >
          <LogOut size={20} className="mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );
}
