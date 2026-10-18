'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocationStore } from '@/store/locationStore';
import { SelectedLocationData } from './OradeaMapPicker';

// Dynamically import the Leaflet map picker to avoid SSR issues
const DynamicOradeaMapPicker = dynamic(() => import('./OradeaMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[520px] bg-white rounded-2xl p-6 text-center">
      <div className="w-10 h-10 border-3 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="font-semibold text-gray-800 text-sm">Loading Oradea Map...</p>
      <p className="text-xs text-gray-500 mt-1">OpenStreetMap & Leaflet</p>
    </div>
  ),
});

interface OradeaMapModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLocationSelected?: (data: SelectedLocationData) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  initialDetails?: string;
}

export default function OradeaMapModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onLocationSelected,
  initialLat,
  initialLng,
  initialAddress,
  initialDetails,
}: OradeaMapModalProps) {
  const { 
    isMapPickerOpen: storeIsOpen, 
    closeMapPicker: storeClose, 
    currentLocation, 
    setLocation 
  } = useLocationStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const handleClose = propOnClose || storeClose;

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = (data: SelectedLocationData) => {
    // Update global location store
    setLocation({
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      details: data.details,
      isValidInOradea: data.isValidInOradea,
    });

    if (onLocationSelected) {
      onLocationSelected(data);
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-lg h-[92vh] max-h-[720px] z-10 animate-in zoom-in-95 duration-200">
        <DynamicOradeaMapPicker
          initialLat={initialLat ?? currentLocation?.lat}
          initialLng={initialLng ?? currentLocation?.lng}
          initialAddress={initialAddress ?? currentLocation?.address}
          initialDetails={initialDetails ?? currentLocation?.details}
          onConfirm={handleConfirm}
          onCancel={handleClose}
        />
      </div>
    </div>
  );
}
