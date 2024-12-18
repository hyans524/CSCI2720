import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import { 
  HK_DEFAULT_CENTER, 
  MAP_ZOOM_LEVELS, 
  DEFAULT_MAP_CONFIG,
  loader
} from '../services/googleMaps';
import { venueApi, authApi } from '../services/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// 將地圖渲染部分分離為獨立的記憶化組件
const MapRenderer = React.memo(({ mapRef, sx }) => {
  return (
    <Box
      ref={mapRef}
      sx={useMemo(() => ({
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        bgcolor: '#f0f0f0',
        border: '1px solid #ccc',
        ...sx
      }), [sx])}
    />
  );
}, (prevProps, nextProps) => {
  return prevProps.sx === nextProps.sx;
});

MapRenderer.displayName = 'MapRenderer';

// 將評論對話框分離為獨立的記憶化組件
const CommentDialog = React.memo(({ open, onClose, venue, isAuthenticated }) => {
  const [localComment, setLocalComment] = useState('');
  const [localRating, setLocalRating] = useState(0);

  // 使用 useMemo 來記憶化對話框的內容
  const dialogContent = useMemo(() => (
    <DialogContent>
      <Box sx={{ mb: 2 }}>
        <Typography component="legend">Rating</Typography>
        <Rating
          value={localRating}
          onChange={(event, newValue) => {
            setLocalRating(newValue);
          }}
        />
      </Box>
      <TextField
        autoFocus
        margin="dense"
        label="Your Comment"
        fullWidth
        multiline
        rows={4}
        value={localComment}
        onChange={(e) => setLocalComment(e.target.value)}
      />
      {venue?.comments && venue.comments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Previous Comments</Typography>
          <List>
            {venue.comments.map((comment, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>{comment.user.username[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span">{comment.user.username}</Typography>
                      <Rating value={comment.rating} readOnly size="small" sx={{ ml: 1 }} />
                    </Box>
                  }
                  secondary={comment.comment}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </DialogContent>
  ), [localComment, localRating, venue?.comments]);

  // 重置表單當對話框關閉時
  useEffect(() => {
    if (!open) {
      setLocalComment('');
      setLocalRating(0);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please login to add a comment');
      return;
    }

    if (!localComment.trim() || !localRating) {
      alert('Please provide both a comment and rating');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add a comment');
        return;
      }

      await venueApi.addComment(venue._id, {
        comment: localComment.trim(),
        rating: Number(localRating)
      });
      
      // Refresh venue data
      const response = await venueApi.getById(venue._id);
      const updatedVenue = response.data;
      
      if (venue.infoWindow) {
        venue.infoWindow.setContent(
          createInfoWindowContent(updatedVenue)
        );
      }
      
      onClose();
      setLocalComment('');
      setLocalRating(0);

      alert('Comment added successfully');
    } catch (err) {
      console.error('Failed to submit comment:', err);
      if (err.response?.status === 401) {
        alert('Please login to add a comment');
      } else {
        alert(err.response?.data?.message || 'Failed to add comment. Please try again.');
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      disableBackdropClick={true}
      TransitionProps={{
        enter: true,
        exit: true
      }}
    >
      <DialogTitle>Add Comment</DialogTitle>
      {dialogContent}
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}, (prevProps, nextProps) => {
  return prevProps.open === nextProps.open && 
         prevProps.venue === nextProps.venue &&
         prevProps.isAuthenticated === nextProps.isAuthenticated;
});

CommentDialog.displayName = 'CommentDialog';

function GoogleMapComponent({
  markers = [],
  center = HK_DEFAULT_CENTER,
  zoom = MAP_ZOOM_LEVELS.TERRITORY,
  onMarkerClick,
  options = {}
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userLocationMarkerRef = useRef(null);
  const [error, setError] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  useEffect(() => {
    if (mapInstance) {
      mapInstance.setZoom(zoom);
      mapInstance.setCenter(center);
    }
  }, [mapInstance, zoom, center]);

  // 使用 useCallback 來記憶化回調函數
  const handleDialogClose = useCallback(() => {
    setCommentDialogOpen(false);
  }, []);

  const createInfoWindowContent = (location) => {
    const addCommentButton = isAuthenticated ? 
      `<button 
        id="addCommentBtn" 
        style="
          background-color: #1976d2; 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 4px; 
          cursor: pointer;
          margin-top: 8px;
        "
      >
        Add Comment
      </button>` : '';

    const comments = location.comments?.map(comment => `
      <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
          <span style="font-weight: 500; margin-right: 8px;">${comment.user.username}</span>
          <span style="color: #f4b400;">★</span>
          <span style="margin-left: 4px;">${comment.rating}</span>
        </div>
        <div style="color: #666;">${comment.comment}</div>
      </div>
    `).join('') || '';

    return `
      <div style="padding: 16px; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 18px;">
          ${location.venueName || location.name}
        </h3>
        <p style="margin: 0 0 8px 0; color: #666;">
          ${location.address}
        </p>
        ${location.averageRating ? `
          <div style="margin: 8px 0;">
            <span style="color: #f4b400; font-size: 16px;">★</span>
            <span style="margin-left: 4px;">${location.averageRating.toFixed(1)}</span>
            <span style="color: #666; margin-left: 4px;">(${location.comments?.length || 0} reviews)</span>
          </div>
        ` : ''}
        ${location.eventCount ? `
          <p style="margin: 8px 0; color: #1976d2; font-weight: 500;">
            ${location.eventCount} events
          </p>
        ` : ''}
        ${comments ? `
          <div style="margin-top: 16px; max-height: 200px; overflow-y: auto;">
            <h4 style="margin: 0 0 8px 0;">Recent Comments</h4>
            ${comments}
          </div>
        ` : ''}
        ${addCommentButton}
      </div>
    `;
  };

  const createUserLocationPin = () => {
    const pin = document.createElement('div');
    pin.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: #4285F4;
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,.3);
      "></div>
    `;
    return pin;
  };

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

        // Initialize map with options
        const mapOptions = {
          ...DEFAULT_MAP_CONFIG,
          ...options,
          center: center,
          zoom: zoom,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          fullscreenControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          scaleControl: false,
          rotateControl: false,
          panControl: false,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          myLocationButton: true,
          myLocationControl: true
        };


        if (!DEFAULT_MAP_CONFIG.mapId) {
          mapOptions.styles = [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            }
          ];
        }

        const map = new google.maps.Map(container, mapOptions);
        mapInstanceRef.current = map;
        setMapInstance(map);

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Create info window instance
        const infoWindow = new google.maps.InfoWindow();

        // Load marker library
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        
        // Process markers
        markers.forEach(location => {
          // Validate coordinates
          const lat = parseFloat(location.latitude || location.lat);
          const lng = parseFloat(location.longitude || location.lng);
          
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

          const marker = new AdvancedMarkerElement({
            map,
            position,
            title: location.venueName || location.name,
            content: pinElement.element,
          });

          // Add animation for selected marker
          if (location.selected) {
            marker.content.style.animation = 'bounce 0.5s infinite alternate';
          }

          // Add click event handler
          marker.addEventListener('gmp-click', () => {
            infoWindow.setContent(createInfoWindowContent(location));
            infoWindow.open(map, marker);

            // Add event listener for the Add Comment button after info window is opened
            google.maps.event.addListener(infoWindow, 'domready', () => {
              const addCommentBtn = document.getElementById('addCommentBtn');
              if (addCommentBtn) {
                addCommentBtn.addEventListener('click', () => {
                  setSelectedVenue({ ...location, infoWindow });
                  setCommentDialogOpen(true);
                });
              }
            });

            if (onMarkerClick) {
              onMarkerClick(location._id);
            }

            // Zoom to marker when clicked
            map.setZoom(MAP_ZOOM_LEVELS.BUILDING);
            map.panTo(position);
          });

          markersRef.current.push(marker);
        });

        map.setOptions({
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          scaleControl: false,
          rotateControl: false,
          panControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          myLocationButton: true,
          myLocationControl: true
        });

        // Add location button
        const locationButton = document.createElement("button");
        locationButton.className = "custom-map-control-button";
        locationButton.style.cssText = `
          background-color: white;
          border: none;
          box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
          margin: 10px;
          padding: 9px;
          border-radius: 50%;
          cursor: pointer;
          width: 40px;
          height: 40px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        locationButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#666666">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
        `;

        // Add hover effects
        locationButton.onmouseover = () => {
          locationButton.style.backgroundColor = '#f5f5f5';
        };

        locationButton.onmouseout = () => {
          locationButton.style.backgroundColor = 'white';
        };

        locationButton.addEventListener("click", () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };

                // Check if location is within Hong Kong bounds
                if (pos.lat >= 22.1 && pos.lat <= 22.6 && 
                    pos.lng >= 113.8 && pos.lng <= 114.4) {
                  
                  map.setCenter(pos);
                  map.setZoom(MAP_ZOOM_LEVELS.STREET);
                  
                  // Remove existing user location marker if it exists
                  if (userLocationMarkerRef.current) {
                    userLocationMarkerRef.current.map = null;
                  }
                  
                  // Create new marker
                  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
                  const userLocationPin = document.createElement('div');
                  userLocationPin.innerHTML = `
                    <div style="
                      width: 24px;
                      height: 24px;
                      background: #4285F4;
                      border: 2px solid #ffffff;
                      border-radius: 50%;
                      box-shadow: 0 2px 6px rgba(0,0,0,.3);
                    "></div>
                  `;

                  // Create and store the new marker
                  userLocationMarkerRef.current = new AdvancedMarkerElement({
                    map,
                    position: pos,
                    content: userLocationPin,
                    title: "Your Location"
                  });
                } else {
                  alert("Sorry, your location is outside of Hong Kong");
                }
              },
              (error) => {
                switch(error.code) {
                  case error.PERMISSION_DENIED:
                    alert("Please enable location services to use this feature");
                    break;
                  case error.POSITION_UNAVAILABLE:
                    alert("Location information is unavailable");
                    break;
                  case error.TIMEOUT:
                    alert("Location request timed out");
                    break;
                  default:
                    alert("An unknown error occurred");
                }
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              }
            );
          } else {
            alert("Error: Your browser doesn't support geolocation.");
          }
        });

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err.message || 'Failed to initialize Google Maps');
      }
    };

    initMap();
  }, [markers, options, onMarkerClick, isAuthenticated]);

  // Helper functions
  const isValidCoordinates = (lat, lng) => {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180 &&
           lat >= 22.1 && lat <= 22.6 && // Extended Hong Kong latitude range
           lng >= 113.8 && lng <= 114.4;  // Hong Kong longitude range
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
      <MapRenderer mapRef={mapRef} />
      
      <CommentDialog 
        open={commentDialogOpen} 
        onClose={handleDialogClose}
        venue={selectedVenue}
        isAuthenticated={isAuthenticated}
      />
    </Box>
  );
}

export default GoogleMapComponent; 