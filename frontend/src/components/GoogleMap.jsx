import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { 
  HK_DEFAULT_CENTER, 
  MAP_ZOOM_LEVELS, 
  DEFAULT_MAP_CONFIG,
  loader
} from '../services/googleMaps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// Map style configuration
const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
];

function GoogleMapComponent({
  markers = [],
  center = HK_DEFAULT_CENTER,
  zoom = MAP_ZOOM_LEVELS.TERRITORY,
  onMarkerClick,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Validate API key
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key is missing');
        }

        const container = mapRef.current;
        if (!container) {
          throw new Error('Map container not found');
        }

        // Set container dimensions
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '400px';

        // Load Google Maps using shared loader
        const google = await loader.load();

        // Custom map controls configuration
        const customMapControls = {
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ['roadmap', 'satellite'],
          },
          zoomControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
          },
          streetViewControl: false,
          fullscreenControl: false,
        };

        // Initialize map with options
        const mapOptions = {
          ...DEFAULT_MAP_CONFIG,
          ...customMapControls,
          center: center,
          zoom: zoom,
          mapId: MAP_ID,
          styles: MAP_STYLES,
        };

        const map = new google.maps.Map(container, mapOptions);
        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Create info window instance
        const infoWindow = new google.maps.InfoWindow();

        // Load marker library
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        
        // Process markers
        const bounds = new google.maps.LatLngBounds();
        let validMarkers = 0;

        markers.forEach(location => {
          // Validate coordinates
          const lat = parseFloat(location.lat);
          const lng = parseFloat(location.lng);
          
          if (!isValidCoordinates(lat, lng)) {
            console.error('Invalid coordinates for location:', location);
            return;
          }

          // Create marker with custom pin
          const pinElement = new PinElement({
            background: location.selected ? "#ff4444" : "#1976d2",
            borderColor: location.selected ? "#cc0000" : "#1565c0",
            glyphColor: "#FFFFFF",
            scale: location.selected ? 1.2 : 1,
            glyph: `${location.eventCount || ''}`,
          });

          const position = { lat, lng };
          bounds.extend(position);
          validMarkers++;

          const marker = new AdvancedMarkerElement({
            map,
            position,
            title: location.name,
            content: pinElement.element,
          });

          // Add animation for selected marker
          if (location.selected) {
            marker.content.style.animation = 'bounce 0.5s infinite alternate';
          }

          // Add click event handler
          marker.addEventListener('click', () => {
            infoWindow.setContent(createInfoWindowContent(location));
            infoWindow.open(map, marker);
            if (onMarkerClick) {
              onMarkerClick(location.id);
            }
          });

          markersRef.current.push(marker);
        });

        // Adjust map view based on markers
        if (validMarkers > 0) {
          map.fitBounds(bounds);
          
          if (validMarkers === 1) {
            map.setZoom(MAP_ZOOM_LEVELS.STREET);
          } else {
            // Add padding for multiple markers
            const currentBounds = map.getBounds();
            if (currentBounds) {
              currentBounds.extend(new google.maps.LatLng(
                bounds.getNorthEast().lat() + 0.01,
                bounds.getNorthEast().lng() + 0.01
              ));
              currentBounds.extend(new google.maps.LatLng(
                bounds.getSouthWest().lat() - 0.01,
                bounds.getSouthWest().lng() - 0.01
              ));
              map.fitBounds(currentBounds);
            }
          }
        } else {
          map.setCenter(HK_DEFAULT_CENTER);
          map.setZoom(MAP_ZOOM_LEVELS.TERRITORY);
        }

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err.message || 'Failed to initialize Google Maps');
      }
    };

    initMap();
  }, [markers, center, zoom, onMarkerClick]);

  // Helper functions
  const isValidCoordinates = (lat, lng) => {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180 &&
           lat >= 22.1 && lat <= 22.5 && // Hong Kong latitude range
           lng >= 113.8 && lng <= 114.4;  // Hong Kong longitude range
  };

  const createInfoWindowContent = (location) => {
    return `
      <div style="padding: 12px;">
        <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">${location.name}</h3>
        <p style="margin: 0 0 4px 0; color: #666;">${location.address}</p>
        ${location.eventCount ? `<p style="margin: 0; color: #1976d2; font-weight: 500;">${location.eventCount} events</p>` : ''}
      </div>
    `;
  };

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <Box
        ref={mapRef}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          position: 'relative',
          bgcolor: '#f0f0f0',
          border: '1px solid #ccc',
        }}
      />
    </Box>
  );
}

export default GoogleMapComponent; 