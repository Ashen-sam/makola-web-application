import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, AlertCircle, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FreeMapComponentProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  error?: string;
  disabled?: boolean;
}

interface MakolaArea {
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  polygon: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
}

const FreeMapComponent: React.FC<FreeMapComponentProps> = ({
  value,
  onChange,
  error,
  disabled = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [makolaArea, setMakolaArea] = useState<MakolaArea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (typeof window !== 'undefined' && !(window as any).L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';

          script.onload = () => {
            setLeafletLoaded(true);
          };

          script.onerror = () => {
            setMapError('Failed to load map library');
            setIsLoading(false);
          };

          document.head.appendChild(script);
        } else if ((window as any).L) {
          setLeafletLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        setMapError('Failed to load map library');
        setIsLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Load Makola area boundaries
  useEffect(() => {
    const loadMakolaArea = async () => {
      try {
        const response = await fetch('/api/validate-location');
        if (response.ok) {
          const data = await response.json();
          setMakolaArea(data);
        } else {
          setMapError('Failed to load Makola area boundaries');
        }
      } catch (error) {
        console.error('Error loading Makola area:', error);
        setMapError('Failed to load map data');
      }
    };

    loadMakolaArea();
  }, []);

  // Initialize map when both Leaflet and Makola area are loaded
  useEffect(() => {
    if (!leafletLoaded || !makolaArea || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      const L = (window as any).L;

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [makolaArea.center.lat, makolaArea.center.lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap tiles (completely free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Draw Makola area polygon
      // const polygon = L.polygon(
      //   makolaArea.polygon.map(point => [point.lat, point.lng]),
      //   {
      //     color: '#10b981',
      //     weight: 2,
      //     opacity: 0.8,
      //     fillColor: '#10b981',
      //     fillOpacity: 0.1,
      //   }
      // ).addTo(map);

      // Add click handler
      map.on('click', async (e: any) => {
        if (disabled) return;

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        await handleMapClick(lat, lng, map, L);
      });

      mapInstanceRef.current = map;
      setIsLoading(false);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [leafletLoaded, makolaArea, disabled

  ]);

  const validateLocation = async (lat: number, lng: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/validate-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error validating location:', error);
      return false;
    }
  };

  const handleMapClick = async (lat: number, lng: number, map: any, L: any) => {
    setIsValidatingLocation(true);

    try {
      // Validate if location is within Makola area
      const isValid = await validateLocation(lat, lng);

      if (!isValid) {
        alert('Selected location is outside Makola area. Please select a location within the highlighted boundaries.');
        setIsValidatingLocation(false);
        return;
      }

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Create custom red marker icon
      const redIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
          background-color: #dc2626;
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          border: 2px solid #white;
          transform: rotate(-45deg);
          margin: -10px 0 0 -10px;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      });

      // Add new marker
      const marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
      markerRef.current = marker;

      setSelectedCoordinates({ lat, lng });

      // Try to get address using Nominatim (free reverse geocoding)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Makola-Issue-Reporter/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const address = data.display_name || `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onChange(address, { lat, lng });
        } else {
          onChange(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        onChange(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
      }

    } catch (error) {
      console.error('Error handling map click:', error);
      alert('Error selecting location. Please try again.');
    } finally {
      setIsValidatingLocation(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsValidatingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const isValid = await validateLocation(lat, lng);

        if (!isValid) {
          alert('Your current location is outside Makola area. Please select a location within the boundaries on the map.');
          setIsValidatingLocation(false);
          return;
        }

        // Update map and marker
        if (mapInstanceRef.current && leafletLoaded) {
          const L = (window as any).L;
          const map = mapInstanceRef.current;

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Create marker at current location
          const redIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="
              background-color: #dc2626;
              width: 20px;
              height: 20px;
              border-radius: 50% 50% 50% 0;
              border: 2px solid #white;
              transform: rotate(-45deg);
              margin: -10px 0 0 -10px;
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          });

          const marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
          markerRef.current = marker;

          // Center map on current location
          map.setView([lat, lng], 17);
        }

        setSelectedCoordinates({ lat, lng });
        onChange(`Current Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
        setIsValidatingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please select a location on the map.');
        setIsValidatingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const clearSelection = () => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setSelectedCoordinates(null);
    onChange('');
  };

  const handleLocationInputChange = (inputValue: string) => {
    onChange(inputValue);
  };

  if (mapError) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => handleLocationInputChange(e.target.value)}
          placeholder="Enter location manually"
          className={`h-11 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
          disabled={disabled}
        />
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            Map failed to load: {mapError}
          </AlertDescription>
        </Alert>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Location Input */}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleLocationInputChange(e.target.value)}
          placeholder="Click on map to select location"
          className={`h-11 pr-10 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
          disabled={disabled}
          readOnly
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>

      {/* Map Container */}
      <div className="relative h-64 w-full border border-slate-300 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading map...</span>
            </div>
          </div>
        )}

        {isValidatingLocation && (
          <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-md shadow-md z-10 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs text-slate-600">Validating location...</span>
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useCurrentLocation}
          disabled={disabled || isValidatingLocation || isLoading}
          className="flex items-center gap-1"
        >
          <Target className="h-3 w-3" />
          <span>Use Current Location</span>
        </Button>

        {selectedCoordinates && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={disabled}
            className="text-slate-600 hover:text-slate-700"
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Selected Coordinates Display */}
      {selectedCoordinates && (
        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-md">
          <div className="text-xs text-emerald-700">
            <span className="font-medium">Selected:</span> {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-slate-500">
        Click anywhere within the highlighted Makola area to select your location. Uses free OpenStreetMap.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FreeMapComponent;