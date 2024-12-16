import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Default coordinates for Hong Kong
export const HK_DEFAULT_CENTER = {
  lat: 22.3193,  // Hong Kong latitude
  lng: 114.1694  // Hong Kong longitude
};

export const DEFAULT_MAP_CONFIG = {
  center: HK_DEFAULT_CENTER,
  zoom: 11,  // Zoom level suitable for viewing all of Hong Kong (11 shows the entire territory)
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true
};

// Map zoom level constants
export const MAP_ZOOM_LEVELS = {
  TERRITORY: 11,    // View entire Hong Kong territory
  DISTRICT: 13,     // View district level
  STREET: 15,       // View street level
  BUILDING: 17      // View building level
};

// Shared Google Maps loader configuration
export const LOADER_CONFIG = {
  apiKey: GOOGLE_MAPS_API_KEY,
  version: "beta",
  libraries: ["places", "geometry", "marker"]
};

// Create a single loader instance
export const loader = new Loader(LOADER_CONFIG);

// Initialize Google Maps
export const initializeGoogleMaps = async (mapElement, config = DEFAULT_MAP_CONFIG) => {
  try {
    const google = await loader.load();
    const map = new google.maps.Map(mapElement, config);
    return { google, map };
  } catch (error) {
    console.error('Error loading Google Maps:', error);
    throw error;
  }
};

// Helper function to create markers
export const createMarker = (map, position, options = {}) => {
  return new google.maps.Marker({
    map,
    position,
    ...options
  });
};

// Helper function to pan to Hong Kong
export const panToHongKong = (map) => {
  map.panTo(HK_DEFAULT_CENTER);
  map.setZoom(MAP_ZOOM_LEVELS.TERRITORY);
};