'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  X, 
  Building2, 
  Loader2 
} from 'lucide-react';
import { 
  isPointInOradea, 
  ORADEA_CENTER, 
  ORADEA_GEOJSON, 
  ORADEA_NEIGHBORHOODS 
} from '@/data/oradeaBoundary';
import { reverseGeocode, searchOradeaPlaces, GeocodeResult } from '@/utils/geocoding';

export interface SelectedLocationData {
  address: string;
  lat: number;
  lng: number;
  details?: string;
  isValidInOradea: boolean;
}

interface OradeaMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  initialDetails?: string;
  onConfirm: (data: SelectedLocationData) => void;
  onCancel?: () => void;
}

export default function OradeaMapPicker({
  initialLat = ORADEA_CENTER.lat,
  initialLng = ORADEA_CENTER.lng,
  initialAddress = 'Piața Unirii, Centru, Oradea',
  initialDetails = '',
  onConfirm,
  onCancel,
}: OradeaMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [address, setAddress] = useState(initialAddress);
  const [apartmentDetails, setApartmentDetails] = useState(initialDetails);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Helper to create custom pin icon
  const createPinIcon = useCallback((L: any, valid: boolean) => {
    return L.divIcon({
      className: 'custom-oradea-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: ${valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${valid ? 'linear-gradient(135deg, #10b981, #047857)' : 'linear-gradient(135deg, #ef4444, #b91c1c)'}; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.3); z-index: 10;">
            ${valid 
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>` 
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            }
          </div>
          <div style="position: absolute; bottom: 0; width: 8px; height: 8px; background-color: ${valid ? '#047857' : '#b91c1c'}; transform: rotate(45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 42],
    });
  }, []);

  // Update position, check Oradea boundary and reverse geocode
  const updatePosition = useCallback(async (lat: number, lng: number, shouldGeocode = true) => {
    setCoords({ lat, lng });
    const inOradea = isPointInOradea(lat, lng);
    setIsValid(inOradea);

    // Update marker icon
    if (markerRef.current && leafletModuleRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createPinIcon(leafletModuleRef.current, inOradea));
    }

    if (shouldGeocode) {
      setIsGeocoding(true);
      try {
        const res = await reverseGeocode(lat, lng);
        setAddress(res.formattedAddress);
      } catch (err) {
        console.error('Reverse geocode error:', err);
      } finally {
        setIsGeocoding(false);
      }
    }
  }, [createPinIcon]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');
      leafletModuleRef.current = L;

      if (!isMounted || !mapContainerRef.current) return;

      // Restrict map panning to Oradea region
      const southWest = L.latLng(46.97, 21.78);
      const northEast = L.latLng(47.17, 22.10);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: bounds,
        maxBoundsViscosity: 0.8,
        zoomControl: false, // We'll add custom positioned zoom control
      });

      mapInstanceRef.current = map;

      // Add zoom control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Render Oradea Municipality Polygon boundary
      const boundaryLayer = L.geoJSON(ORADEA_GEOJSON as any, {
        style: {
          color: '#059669', // Emerald 600
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 6',
          fillColor: '#10b981', // Emerald 500
          fillOpacity: 0.12,
        },
      }).addTo(map);

      // Initial boundary check
      const initialValid = isPointInOradea(initialLat, initialLng);
      setIsValid(initialValid);

      // Add draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: createPinIcon(L, initialValid),
        riseOnHover: true,
      }).addTo(map);

      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        updatePosition(lat, lng, true);
      });

      // Handle map click
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        updatePosition(lat, lng, true);
      });

      // Recalculate dimensions
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // Automatically invalidate size on resize
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng, createPinIcon, updatePosition]);

  // Handle live search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchOradeaPlaces(val);
        setSearchResults(results);
        setIsSearching(false);
      }, 350);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchResults(false);
    }
  };

  const handleSelectSearchResult = (result: GeocodeResult) => {
    setShowSearchResults(false);
    setSearchQuery(result.name);
    setAddress(result.name);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lng], 16, { duration: 1.2 });
    }
    updatePosition(result.lat, result.lng, false);
  };

  // Neighborhood Quick Jumps
  const handleSelectNeighborhood = (hood: typeof ORADEA_NEIGHBORHOODS[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hood.lat, hood.lng], 15, { duration: 1.0 });
    }
    updatePosition(hood.lat, hood.lng, true);
  };

  // Use GPS location
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const inOradea = isPointInOradea(latitude, longitude);

        if (inOradea) {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
          }
          updatePosition(latitude, longitude, true);
        } else {
          // GPS is outside Oradea
          setGpsNotice('Current GPS is outside Oradea! Snapping map to Oradea City Center.');
          setTimeout(() => setGpsNotice(null), 4500);
          handleResetToCenter();
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Could not access current location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Reset to Oradea Center
  const handleResetToCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([ORADEA_CENTER.lat, ORADEA_CENTER.lng], 14, { duration: 1 });
    }
    updatePosition(ORADEA_CENTER.lat, ORADEA_CENTER.lng, true);
  };

  // Confirm Selection
  const handleConfirm = () => {
    if (!isValid) return;

    const fullFormatted = apartmentDetails.trim() 
      ? `${address} (${apartmentDetails.trim()})`
      : address;

    onConfirm({
      address: fullFormatted,
      lat: coords.lat,
      lng: coords.lng,
      details: apartmentDetails.trim(),
      isValidInOradea: isValid,
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-white sm:rounded-2xl overflow-hidden relative">
      {/* Top Header & Search Bar - Fixed, compact on mobile */}
      <div className="flex-shrink-0 px-3.5 pt-3 pb-2 sm:p-4 bg-white border-b border-gray-100 space-y-2 sm:space-y-2.5 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <MapPin size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">
                Select Delivery Location in Oradea
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                Delivery exclusively within Oradea City (OpenStreetMap)
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {isSearching ? <Loader2 size={15} className="animate-spin text-green-600" /> : <Search size={15} />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search street, area, or landmark in Oradea..."
            className="w-full pl-8.5 pr-8.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-52 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2 hover:bg-green-50 text-xs flex items-center space-x-2 border-b border-gray-50 last:border-0 transition-colors"
                >
                  <MapPin size={14} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Neighborhood Jump Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto hide-scrollbar py-0.5 -mx-1 px-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 mr-0.5">
            Areas:
          </span>
          {ORADEA_NEIGHBORHOODS.slice(0, 7).map((hood) => (
            <button
              key={hood.name}
              type="button"
              onClick={() => handleSelectNeighborhood(hood)}
              className="text-[11px] sm:text-xs whitespace-nowrap px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-700 font-medium transition-all active:scale-95"
            >
              {hood.name}
            </button>
          ))}
        </div>
      </div>

      {/* Middle Map & Location Details - Fluidly takes available screen height */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {/* Map Container Area */}
        <div className="flex-1 min-h-[140px] sm:min-h-[220px] relative bg-gray-100 w-full">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* GPS Alert Toast */}
          {gpsNotice && (
            <div className="absolute top-2.5 left-3 right-3 z-[1000] bg-amber-500 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top duration-300">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span className="truncate">{gpsNotice}</span>
            </div>
          )}

          {/* Floating Controls on Map */}
          <div className="absolute bottom-3 right-3 z-[1000] flex flex-col space-y-1.5">
            {/* GPS Current Location Button */}
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={isLocating}
              title="My Location (GPS)"
              className="w-10 h-10 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 size={16} className="animate-spin text-green-600" />
              ) : (
                <Navigation size={16} className="text-green-600" />
              )}
            </button>

            {/* Reset to Oradea Center Button */}
            <button
              type="button"
              onClick={handleResetToCenter}
              title="Oradea City Center"
              className="w-10 h-10 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all"
            >
              <RotateCcw size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Legend Badge: Oradea Delivery Boundary */}
          <div className="absolute top-2.5 left-2.5 z-[1000] bg-white/95 backdrop-blur-sm border border-green-200 text-green-800 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-lg shadow-sm flex items-center space-x-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Oradea Delivery Zone (Bihor)</span>
          </div>
        </div>

        {/* Address and Details Card (between map and fixed buttons) */}
        <div className="flex-shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white border-t border-gray-100 space-y-1.5">
          {/* Boundary Validation Alert */}
          {isValid ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-start space-x-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">
                    Valid location in Oradea
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Delivery 25-40 min
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 truncate">
                  {isGeocoding ? 'Detecting address...' : address}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                  Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-start space-x-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs font-bold text-red-800 uppercase tracking-wider">
                  Outside Oradea Delivery Zone
                </span>
                <p className="text-[10px] sm:text-xs text-red-700 mt-0.5 leading-snug">
                  Selected point is outside Oradea boundary. Please select inside green zone.
                </p>
                <button
                  type="button"
                  onClick={handleResetToCenter}
                  className="mt-1 text-[10px] sm:text-xs font-bold text-red-700 hover:text-red-800 underline inline-block"
                >
                  Reset pin to Oradea center
                </button>
              </div>
            </div>
          )}

          {/* Optional Apartment / Intercom details input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
              <Building2 size={14} />
            </div>
            <input
              type="text"
              value={apartmentDetails}
              onChange={(e) => setApartmentDetails(e.target.value)}
              placeholder="Address details: Apt, floor, building, entrance, intercom (optional)"
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Pinned Bottom Action Bar - 100% visible on all mobile screens */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200/90 px-3.5 py-2.5 sm:px-4 sm:py-3 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-safe">
        <div className="flex items-center space-x-2.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 sm:py-3 px-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isGeocoding}
            className={`flex-[2] py-2.5 sm:py-3 px-4 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center transition-all ${
              isValid && !isGeocoding
                ? 'bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-md shadow-green-600/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGeocoding ? (
              <span className="flex items-center">
                <Loader2 size={16} className="animate-spin mr-2" />
                Detecting...
              </span>
            ) : isValid ? (
              'Confirm Delivery Location'
            ) : (
              'Select location in Oradea'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
