'use client';

import { ArrowLeft, Save, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setAddress(parsed.address || '');
      setMobile(parsed.mobile || '');
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, mobile })
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
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <MapPin size={16} className="mr-2 text-gray-400" />
                Delivery Address
              </label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none text-sm"
                placeholder="Enter your full delivery address"
              />
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
