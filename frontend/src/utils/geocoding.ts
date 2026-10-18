/**
 * Utility functions for geocoding and reverse geocoding
 * using OpenStreetMap Nominatim with backend proxy and browser fallback.
 */

export interface GeocodeResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  displayName: string;
  road?: string;
  houseNumber?: string;
  neighborhood?: string;
  city?: string;
  lat: number;
  lng: number;
}

/**
 * Reverse geocode a latitude/longitude to a readable Romanian address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  // First try backend proxy endpoint
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          formattedAddress: data.formattedAddress,
          displayName: data.displayName,
          road: data.addressDetails?.road || '',
          houseNumber: data.addressDetails?.house_number || '',
          neighborhood: data.addressDetails?.suburb || data.addressDetails?.neighbourhood || '',
          city: data.addressDetails?.city || 'Oradea',
          lat,
          lng
        };
      }
    }
  } catch (err) {
    // Backend proxy unavailable or timed out, fall through to client fetch
  }

  // Fallback: direct Nominatim call
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        signal: AbortSignal.timeout(6000)
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.footway || '';
      const number = addr.house_number ? ` Nr. ${addr.house_number}` : '';
      const neighborhood = addr.suburb || addr.neighbourhood || '';
      const city = addr.city || addr.town || addr.municipality || 'Oradea';
      
      let cleanAddress = [street + number, neighborhood, city].filter(Boolean).join(', ');
      if (!cleanAddress) cleanAddress = data.display_name || `Oradea (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      return {
        formattedAddress: cleanAddress,
        displayName: data.display_name,
        road: street,
        houseNumber: addr.house_number,
        neighborhood,
        city,
        lat,
        lng
      };
    }
  } catch (err) {
    console.warn('Direct reverse geocode failed, using coordinates fallback:', err);
  }

  // Graceful coordinate fallback
  return {
    formattedAddress: `Street in Oradea (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    displayName: `Oradea, Bihor, Romania`,
    city: 'Oradea',
    lat,
    lng
  };
}

/**
 * Search places in Oradea using OpenStreetMap Nominatim.
 */
export async function searchOradeaPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  // Try backend proxy first
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (err) {
    // Fall through to direct search
  }

  // Direct Nominatim search fallback
  try {
    const q = `${query.trim()}, Oradea, Romania`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&bounded=1&viewbox=21.8428,47.1421,22.0322,47.0070&limit=6&addressdetails=1`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => {
        const addr = item.address || {};
        const street = addr.road || addr.pedestrian || item.display_name.split(',')[0];
        const number = addr.house_number ? ` Nr. ${addr.house_number}` : '';
        const neighborhood = addr.suburb || addr.neighbourhood || '';
        const label = [street + number, neighborhood, 'Oradea'].filter(Boolean).join(', ');

        return {
          name: label,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type
        };
      });
    }
  } catch (err) {
    console.warn('Search geocode fallback failed:', err);
  }

  return [];
}
