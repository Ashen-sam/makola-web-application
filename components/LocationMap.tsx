// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { MapPin, Navigation, Search } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';

// interface LocationMapProps {
//     value: string;
//     onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
//     error?: string;
//     disabled?: boolean;
// }

// interface LocationResult {
//     display_name: string;
//     lat: string;
//     lon: string;
//     place_id: number;
//     type?: string;
//     class?: string;
// }

// const LocationMapComponent: React.FC<LocationMapProps> = ({
//     value,
//     onChange,
//     error,
//     disabled = false
// }) => {
//     const mapRef = useRef<HTMLDivElement>(null);
//     const mapInstanceRef = useRef<any>(null);
//     const markerRef = useRef<any>(null);
//     const [isMapLoaded, setIsMapLoaded] = useState(false);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
//     const [isSearching, setIsSearching] = useState(false);
//     const [showSearch, setShowSearch] = useState(false);
//     const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

//     // Makola area bounds in Kiribathgoda, Gampaha District
//     // Makola is located north-east of main Gampaha town
//     const MAKOLA_BOUNDS = {
//         north: 7.1050,   // Northern boundary
//         south: 7.0850,   // Southern boundary  
//         east: 80.0250,   // Eastern boundary
//         west: 79.9950    // Western boundary
//     };

//     const MAKOLA_CENTER = {
//         lat: 7.0950,     // Center of Makola area
//         lng: 80.0100     // Center longitude
//     };

//     // No predefined streets - use real geocoding only

//     // Load Leaflet dynamically
//     useEffect(() => {
//         const loadLeaflet = async () => {
//             if (window.L) {
//                 initializeMap();
//                 return;
//             }

//             // Load Leaflet CSS
//             const link = document.createElement('link');
//             link.rel = 'stylesheet';
//             link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//             document.head.appendChild(link);

//             // Load Leaflet JS
//             const script = document.createElement('script');
//             script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
//             script.onload = initializeMap;
//             document.body.appendChild(script);
//         };

//         loadLeaflet();

//         return () => {
//             if (mapInstanceRef.current) {
//                 mapInstanceRef.current.remove();
//             }
//         };
//     }, []);

//     const initializeMap = () => {
//         if (!mapRef.current || mapInstanceRef.current) return;

//         try {
//             const L = window.L;

//             // Initialize map centered on Makola area
//             const map = L.map(mapRef.current, {
//                 center: [MAKOLA_CENTER.lat, MAKOLA_CENTER.lng],
//                 zoom: 15,
//                 maxBounds: [
//                     [MAKOLA_BOUNDS.south - 0.005, MAKOLA_BOUNDS.west - 0.005],
//                     [MAKOLA_BOUNDS.north + 0.005, MAKOLA_BOUNDS.east + 0.005]
//                 ],
//                 maxBoundsViscosity: 0.8
//             });

//             // Add OpenStreetMap tiles
//             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//                 attribution: '© OpenStreetMap contributors',
//                 maxZoom: 19
//             }).addTo(map);

//             // Add Makola area boundary rectangle
//             const makolaBounds = L.rectangle([
//                 [MAKOLA_BOUNDS.south, MAKOLA_BOUNDS.west],
//                 [MAKOLA_BOUNDS.north, MAKOLA_BOUNDS.east]
//             ], {
//                 color: '#10b981',
//                 weight: 3,
//                 fillOpacity: 0.15,
//                 fillColor: '#10b981'
//             }).addTo(map);

//             // Add area label
//             L.marker([MAKOLA_CENTER.lat, MAKOLA_CENTER.lng], {
//                 icon: L.divIcon({
//                     className: 'area-label',
//                     html: `<div style="background: rgba(16, 185, 129, 0.9); color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Makola Area<br><small style="font-size: 10px;">Kiribathgoda, Gampaha</small></div>`,
//                     iconSize: [150, 40],
//                     iconAnchor: [75, 20]
//                 })
//             }).addTo(map);

//             // Add click handler for map
//             map.on('click', async (e: any) => {
//                 const { lat, lng } = e.latlng;

//                 // Check if click is within Makola bounds
//                 if (isWithinMakolaBounds(lat, lng)) {
//                     await reverseGeocode(lat, lng);
//                     addOrUpdateMarker(lat, lng);
//                 } else {
//                     // Show a gentle notification
//                     L.popup()
//                         .setLatLng(e.latlng)
//                         .setContent('<div style="text-align: center; color: #dc2626;"><strong>Outside Makola Area</strong><br>Please click within the highlighted green area</div>')
//                         .openOn(map);
//                 }
//             });

//             mapInstanceRef.current = map;
//             setIsMapLoaded(true);

//             // If there's an initial value, try to geocode it
//             if (value) {
//                 searchLocation(value, false);
//             }

//         } catch (error) {
//             console.error('Error initializing map:', error);
//         }
//     };

//     const isWithinMakolaBounds = (lat: number, lng: number): boolean => {
//         return lat >= MAKOLA_BOUNDS.south &&
//             lat <= MAKOLA_BOUNDS.north &&
//             lng >= MAKOLA_BOUNDS.west &&
//             lng <= MAKOLA_BOUNDS.east;
//     };

//     const addOrUpdateMarker = (lat: number, lng: number) => {
//         if (!mapInstanceRef.current) return;

//         const L = window.L;

//         // Remove existing marker
//         if (markerRef.current) {
//             mapInstanceRef.current.removeLayer(markerRef.current);
//         }

//         // Add new marker with bounce animation
//         const marker = L.marker([lat, lng], {
//             icon: L.divIcon({
//                 className: 'custom-marker',
//                 html: `<div style="
//                     background: #ef4444; 
//                     width: 26px; 
//                     height: 26px; 
//                     border-radius: 50%; 
//                     border: 4px solid white; 
//                     box-shadow: 0 3px 8px rgba(0,0,0,0.4);
//                     animation: bounce 0.6s ease-in-out;
//                 "></div>
//                 <style>
//                 @keyframes bounce {
//                     0%, 100% { transform: translateY(0); }
//                     50% { transform: translateY(-10px); }
//                 }
//                 </style>`,
//                 iconSize: [26, 26],
//                 iconAnchor: [13, 13]
//             })
//         }).addTo(mapInstanceRef.current);

//         markerRef.current = marker;
//         setCurrentLocation({ lat, lng });
//     };

//     const reverseGeocode = async (lat: number, lng: number) => {
//         try {
//             const response = await fetch(
//                 `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
//             );
//             const data = await response.json();

//             if (data && data.display_name) {
//                 onChange(data.display_name, { lat, lng });
//             } else {
//                 // Fallback to a more readable format
//                 onChange(`Makola Area (${lat.toFixed(6)}, ${lng.toFixed(6)})`, { lat, lng });
//             }
//         } catch (error) {
//             console.error('Reverse geocoding failed:', error);
//             onChange(`Makola Area (${lat.toFixed(6)}, ${lng.toFixed(6)})`, { lat, lng });
//         }
//     };

//     const searchLocation = async (query: string, updateInput = true) => {
//         if (!query.trim()) {
//             setSearchResults([]);
//             return;
//         }

//         setIsSearching(true);
//         try {
//             const results: LocationResult[] = [];

//             // Search Nominatim with multiple search strategies
//             const searchQueries = [
//                 `${query}, Makola, Kiribathgoda, Gampaha, Sri Lanka`,
//                 `${query}, Makola, Gampaha District, Sri Lanka`,
//                 `${query}, Kiribathgoda, Gampaha, Sri Lanka`,
//                 `${query}, Gampaha District, Western Province, Sri Lanka`
//             ];

//             for (const searchQuery of searchQueries) {
//                 try {
//                     const response = await fetch(
//                         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&bounded=1&viewbox=${MAKOLA_BOUNDS.west},${MAKOLA_BOUNDS.north},${MAKOLA_BOUNDS.east},${MAKOLA_BOUNDS.south}&addressdetails=1&extratags=1`
//                     );
//                     const data = await response.json();

//                     // Filter results to only include those within Makola bounds (with small buffer)
//                     const filteredResults = data.filter((result: LocationResult) => {
//                         const lat = parseFloat(result.lat);
//                         const lng = parseFloat(result.lon);
//                         return lat >= MAKOLA_BOUNDS.south - 0.01 &&
//                             lat <= MAKOLA_BOUNDS.north + 0.01 &&
//                             lng >= MAKOLA_BOUNDS.west - 0.01 &&
//                             lng <= MAKOLA_BOUNDS.east + 0.01;
//                     });

//                     results.push(...filteredResults);
//                 } catch (error) {
//                     console.error(`Search failed for query: ${searchQuery}`, error);
//                 }
//             }

//             // Remove duplicates based on coordinates (with tolerance for slight differences)
//             const uniqueResults = results.filter((result, index, self) =>
//                 index === self.findIndex(r =>
//                     Math.abs(parseFloat(r.lat) - parseFloat(result.lat)) < 0.0005 &&
//                     Math.abs(parseFloat(r.lon) - parseFloat(result.lon)) < 0.0005
//                 )
//             );

//             // Sort by relevance (exact matches first, then partial matches)
//             const sortedResults = uniqueResults.sort((a, b) => {
//                 const aLower = a.display_name.toLowerCase();
//                 const bLower = b.display_name.toLowerCase();
//                 const queryLower = query.toLowerCase();

//                 // Prioritize results with "Makola" in the name
//                 const aMakola = aLower.includes('makola');
//                 const bMakola = bLower.includes('makola');

//                 if (aMakola && !bMakola) return -1;
//                 if (!aMakola && bMakola) return 1;

//                 // Then prioritize exact query matches
//                 if (aLower.includes(queryLower) && !bLower.includes(queryLower)) return -1;
//                 if (!aLower.includes(queryLower) && bLower.includes(queryLower)) return 1;

//                 return 0;
//             });

//             setSearchResults(sortedResults.slice(0, 8)); // Limit to 8 results

//             if (updateInput && sortedResults.length > 0) {
//                 setShowSearch(true);
//             }
//         } catch (error) {
//             console.error('Search failed:', error);
//         } finally {
//             setIsSearching(false);
//         }
//     };

//     const selectLocation = (result: LocationResult) => {
//         const lat = parseFloat(result.lat);
//         const lng = parseFloat(result.lon);

//         onChange(result.display_name, { lat, lng });
//         addOrUpdateMarker(lat, lng);

//         if (mapInstanceRef.current) {
//             mapInstanceRef.current.setView([lat, lng], 17);
//         }

//         setShowSearch(false);
//         setSearchQuery('');
//         setSearchResults([]);
//     };

//     const getCurrentLocation = () => {
//         if (!navigator.geolocation) {
//             alert('Geolocation is not supported by this browser.');
//             return;
//         }

//         navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 const lat = position.coords.latitude;
//                 const lng = position.coords.longitude;

//                 if (isWithinMakolaBounds(lat, lng)) {
//                     reverseGeocode(lat, lng);
//                     addOrUpdateMarker(lat, lng);
//                     if (mapInstanceRef.current) {
//                         mapInstanceRef.current.setView([lat, lng], 17);
//                     }
//                 } else {
//                     alert('Your current location is outside the Makola area (Kiribathgoda, Gampaha). Please select a location within the highlighted green area on the map.');
//                 }
//             },
//             (error) => {
//                 console.error('Error getting location:', error);
//                 let errorMessage = 'Unable to retrieve your location. ';
//                 switch (error.code) {
//                     case error.PERMISSION_DENIED:
//                         errorMessage += 'Location access denied by user.';
//                         break;
//                     case error.POSITION_UNAVAILABLE:
//                         errorMessage += 'Location information unavailable.';
//                         break;
//                     case error.TIMEOUT:
//                         errorMessage += 'Location request timed out.';
//                         break;
//                     default:
//                         errorMessage += 'Unknown error occurred.';
//                         break;
//                 }
//                 alert(errorMessage + ' Please select manually on the map or use search.');
//             }
//         );
//     };

//     const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const newValue = e.target.value;
//         onChange(newValue);
//         setSearchQuery(newValue);

//         if (newValue.length > 1) {
//             searchLocation(newValue);
//             setShowSearch(true);
//         } else {
//             setSearchResults([]);
//             setShowSearch(false);
//         }
//     };

//     return (
//         <div className="space-y-4">
//             {/* Location Input with Search */}
//             <div className="relative">
//                 <div className="flex gap-2">
//                     <div className="relative flex-1">
//                         <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
//                         <Input
//                             value={value}
//                             onChange={handleSearchInputChange}
//                             placeholder="Search in Makola area, Kiribathgoda or click on map to select location"
//                             className={`pl-10 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500'}`}
//                             disabled={disabled}
//                         />
//                         {isSearching && (
//                             <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                                 <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
//                             </div>
//                         )}
//                     </div>

//                     <Button
//                         type="button"
//                         variant="outline"
//                         size="icon"
//                         onClick={() => {
//                             if (searchQuery) {
//                                 searchLocation(searchQuery);
//                                 setShowSearch(true);
//                             }
//                         }}
//                         disabled={disabled || !searchQuery}
//                         className="shrink-0"
//                         title="Search in Makola area"
//                     >
//                         <Search className="h-4 w-4" />
//                     </Button>

//                     <Button
//                         type="button"
//                         variant="outline"
//                         size="icon"
//                         onClick={getCurrentLocation}
//                         disabled={disabled}
//                         className="shrink-0"
//                         title="Use current location (if in Makola area)"
//                     >
//                         <Navigation className="h-4 w-4" />
//                     </Button>
//                 </div>

//                 {/* Search Results Dropdown */}
//                 {showSearch && searchResults.length > 0 && (
//                     <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto shadow-lg">
//                         <CardContent className="p-0">
//                             {searchResults.map((result, index) => (
//                                 <button
//                                     key={`${result.place_id}-${index}`}
//                                     type="button"
//                                     className="w-full text-left p-3 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0 transition-colors"
//                                     onClick={() => selectLocation(result)}
//                                 >
//                                     <div className="flex items-start gap-2">
//                                         <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
//                                         <div className="min-w-0 flex-1">
//                                             <span className="text-sm text-slate-700 block font-medium">{result.display_name}</span>
//                                             {result.type && (
//                                                 <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
//                                                     {result.type}
//                                                 </span>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </button>
//                             ))}
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* No Results Message */}
//                 {showSearch && searchQuery && searchResults.length === 0 && !isSearching && (
//                     <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
//                         <CardContent className="p-4 text-center text-sm text-slate-500">
//                             <MapPin className="h-5 w-5 text-slate-400 mx-auto mb-2" />
//                             No locations found in Makola area for "{searchQuery}".
//                             <br />
//                             Try a different search term or click directly on the map.
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>

//             {/* Map Container */}
//             <div className="relative">
//                 <div
//                     ref={mapRef}
//                     className="w-full h-80 bg-slate-100 rounded-lg border-2 border-slate-300 shadow-inner"
//                     style={{ minHeight: '320px' }}
//                 />

//                 {!isMapLoaded && (
//                     <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
//                         <div className="text-center space-y-3">
//                             <div className="w-8 h-8 border-3 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto" />
//                             <p className="text-sm text-slate-600 font-medium">Loading Makola area map...</p>
//                             <p className="text-xs text-slate-500">Kiribathgoda, Gampaha District</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Map Instructions */}
//                 <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
//                     <div className="text-xs text-slate-600 space-y-1">
//                         <p className="font-semibold text-emerald-700 mb-2">📍 How to select a location in Makola:</p>
//                         <p>• <strong>Search:</strong> Type any location name, street, or landmark in Makola area</p>
//                         <p>• <strong>Click:</strong> Click anywhere within the highlighted green area on the map</p>
//                         <p>• <strong>GPS:</strong> Use the navigation button if you're currently in Makola area</p>
//                         {currentLocation && (
//                             <p className="text-emerald-600 font-medium mt-2">
//                                 ✅ Selected: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
//                             </p>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Error Display */}
//             {error && (
//                 <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                     <p className="text-sm text-red-600 flex items-center gap-2">
//                         <span className="text-red-500">⚠️</span>
//                         {error}
//                     </p>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default LocationMapComponent;