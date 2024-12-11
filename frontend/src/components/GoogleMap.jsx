import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// 香港的默認中心點
const HK_CENTER = { lat: 22.3193, lng: 114.1694 };

function GoogleMapComponent({
  markers = [],
  center = HK_CENTER,
  zoom = 11,
  onMarkerClick,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const container = mapRef.current;
        console.log('Map container dimensions:', {
          width: container?.clientWidth,
          height: container?.clientHeight,
        });

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'beta',
          libraries: ['places', 'geometry', 'marker'],
        });

        const google = await loader.load();
        console.log('Google Maps loaded successfully');

        if (!container) {
          console.error('Map container not found');
          return;
        }

        // 確保容器尺寸
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '400px';

        // 初始化地圖
        const mapOptions = {
          center: center || HK_CENTER,
          zoom: zoom,
          mapId: MAP_ID,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          // 添加默認的地圖樣式
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
          ],
        };

        console.log('Creating map with center:', center);
        const map = new google.maps.Map(container, mapOptions);
        mapInstanceRef.current = map;

        // 清除現有標記
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // 創建信息窗口
        const infoWindow = new google.maps.InfoWindow();

        // 添加標記
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        
        const bounds = new google.maps.LatLngBounds();
        let validMarkers = 0;

        markers.forEach(location => {
          // 驗證經緯度
          const lat = parseFloat(location.lat);
          const lng = parseFloat(location.lng);
          
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error('Invalid coordinates for location:', location);
            return;
          }

          console.log('Creating marker at:', { lat, lng });
          
          const pinElement = new PinElement({
            background: location.selected ? "#ff4444" : "#1976d2",
            borderColor: location.selected ? "#cc0000" : "#1565c0",
            glyphColor: "#FFFFFF",
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

          marker.addEventListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 12px;">
                <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">${location.name}</h3>
                <p style="margin: 0 0 4px 0; color: #666;">${location.address}</p>
                ${location.eventCount ? `<p style="margin: 0; color: #1976d2; font-weight: 500;">${location.eventCount} events</p>` : ''}
              </div>
            `);
            infoWindow.open(map, marker);
            if (onMarkerClick) {
              onMarkerClick(location.id);
            }
          });

          markersRef.current.push(marker);
        });

        // 只有在有有效標記時才調整邊界
        if (validMarkers > 0) {
          map.fitBounds(bounds);
          // 如果只有一個標記，設置更高的縮放級別
          if (validMarkers === 1) {
            map.setZoom(15);
          }
        } else {
          // 如果沒有有效標記，居中到香港
          map.setCenter(HK_CENTER);
          map.setZoom(11);
        }

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize Google Maps');
      }
    };

    initMap();
  }, [markers, center, zoom, onMarkerClick]);

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
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
  );
}

export default GoogleMapComponent; 