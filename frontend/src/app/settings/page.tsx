'use client';

import { ArrowLeft, Save, MapPin, Phone, Map } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/locationStore';

export default function SettingsPage() {
  const { openMapPicker, currentLocation } = useLocationStore();
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setAddress(parsed.address || '');
      setMobile(parsed.mobile || '');
      if (parsed.deliveryLocation) {
        setCoords(parsed.deliveryLocation);
      }
    }
  }, []);

  // When locationStore updates from map modal, sync with input
  useEffect(() => {
    if (currentLocation?.address && currentLocation.address !== address) {
      setAddress(currentLocation.address);
      setCoords({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [currentLocation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsSaving(true);
    setMessage('');

    try {
      const payload: any = { address, mobile };
      if (coords) payload.deliveryLocation = coords;

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setMessage('Settings updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error, try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500">Please log in to view settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-40">
        <Link href="/profile" className="p-2 -ml-2 mr-2 active:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5">
          <h2 className="font-bold text-gray-900 mb-6">Personal Information</h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700 flex items-center">
                  <MapPin size={16} className="mr-2 text-green-600" />
                  Delivery Address (Oradea)
                </label>
                <button
                  type="button"
                  onClick={openMapPicker}
                  className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 active:scale-95 transition-all flex items-center"
                >
                  <Map size={13} className="mr-1" />
                  Pick on Map
                </button>
              </div>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none text-sm"
                placeholder="e.g. Piața Unirii, Oradea"
              />
              {coords && (
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Saved GPS coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Phone size={16} className="mr-2 text-gray-400" />
                Phone Number
              </label>
              <input 
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                placeholder="e.g. +94 77 123 4567"
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full mt-4 bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
