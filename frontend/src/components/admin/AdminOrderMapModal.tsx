'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  X, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  Navigation, 
  Receipt,
  Clock,
  Compass
} from 'lucide-react';
import { ORADEA_GEOJSON, ORADEA_CENTER, isPointInOradea } from '@/data/oradeaBoundary';

interface AdminOrderMapModalProps {
  order?: any;
  user?: any;
  onClose: () => void;
}

export default function AdminOrderMapModal({ order, user, onClose }: AdminOrderMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);

  const data = order || user || {};
  const isOrder = !!data.orderId;

  // Determine delivery coordinates
  const lat = data?.deliveryLocation?.lat ?? ORADEA_CENTER.lat;
  const lng = data?.deliveryLocation?.lng ?? ORADEA_CENTER.lng;
  const customerName = data?.customerName || data?.fullName || 'Customer';
  const customerPhone = data?.customerPhone || data?.mobile || '';
  const address = data?.deliveryAddress || data?.address || 'No address provided';
  const title = isOrder ? `Order #${data.orderId} Delivery Location` : `Customer Location: ${customerName}`;

  const hasExactGPS = !!(data?.deliveryLocation?.lat && data?.deliveryLocation?.lng);
  const isInOradea = isPointInOradea(lat, lng);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        minZoom: 11,
        maxZoom: 19,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Oradea Boundary Polygon
      L.geoJSON(ORADEA_GEOJSON as any, {
        style: {
          color: '#059669',
          weight: 2,
          opacity: 0.8,
          dashArray: '5, 5',
          fillColor: '#10b981',
          fillOpacity: 0.1,
        },
      }).addTo(map);

      // Custom Delivery Pin Icon
      const customerIcon = L.divIcon({
        className: 'admin-delivery-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #047857); display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px;">
              📍
            </div>
            <div style="position: absolute; bottom: 0; width: 8px; height: 8px; background-color: #047857; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 42],
      });

      // Add Marker with Popup
      const marker = L.marker([lat, lng], { icon: customerIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; padding: 2px;">
          <div style="font-weight: bold; font-size: 13px; color: #111827;">${customerName}</div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">${address}</div>
          ${isOrder 
            ? `<div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 4px;">#${data.orderId} • Lei ${data.totalDue || 0}</div>`
            : `<div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 4px;">Registered Customer</div>`
          }
        </div>
      `).openPopup();

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, customerName, address, isOrder, data]);

  // Google Maps Directions Link
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  // Waze Directions Link
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
              <MapPin size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {title}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isInOradea 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isInOradea ? 'In Oradea Zone' : 'Outside Boundary'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Customer: <span className="font-semibold text-gray-800">{customerName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-gray-100">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick Floating Navigation Buttons on Map */}
          <div className="absolute bottom-3 right-3 z-[1000] flex items-center space-x-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-gray-200 flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <Navigation size={14} className="text-blue-600" />
              <span>Google Maps</span>
              <ExternalLink size={12} className="text-gray-400" />
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-gray-200 flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <Compass size={14} className="text-cyan-600" />
              <span>Waze</span>
              <ExternalLink size={12} className="text-gray-400" />
            </a>
          </div>

          {/* GPS Accuracy Status Badge */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${hasExactGPS ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-gray-700">
              {hasExactGPS ? 'Exact Pin Selected on OpenStreetMap' : 'Oradea City Location'}
            </span>
          </div>
        </div>

        {/* Delivery Details & Driver Action Panel */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs">
            {/* Delivery Address */}
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                Delivery Address
              </span>
              <p className="font-bold text-gray-900 text-sm leading-snug">
                {address}
              </p>
              <p className="text-gray-500 text-[11px] mt-1 font-mono">
                GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>

            {/* Customer & Contact Info */}
            <div className="space-y-1.5">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                Customer & Contact Info
              </span>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone:</span>
                {customerPhone ? (
                  <a
                    href={`tel:${customerPhone}`}
                    className="font-bold text-green-700 hover:text-green-800 flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-200 transition-colors"
                  >
                    <Phone size={12} className="mr-1" />
                    {customerPhone}
                  </a>
                ) : (
                  <span className="font-semibold text-gray-700">N/A</span>
                )}
              </div>
              {isOrder ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Due:</span>
                    <span className="font-black text-green-600 text-sm">Lei {data.totalDue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Payment:</span>
                    <span className="font-semibold text-gray-700">{data.paymentMethod || 'Cash on Delivery'}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold text-gray-800 truncate">{data.email || 'N/A'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Driver / Admin */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-green-600/25 active:scale-[0.98] transition-all"
            >
              <Navigation size={16} />
              <span>Start Delivery Navigation (GPS)</span>
            </a>

            <button
              onClick={copyCoordinates}
              className="w-full sm:w-auto py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors active:scale-[0.98]"
            >
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              <span>{copied ? 'Copied GPS!' : 'Copy GPS'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
