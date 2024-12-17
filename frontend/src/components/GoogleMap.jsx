import { useEffect, useRef, useState } from 'react';
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
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  const handleCommentSubmit = async () => {
    try {
      await venueApi.addComment(selectedVenue.id, {
        comment,
        rating,
      });
      
      // Refresh venue data
      const response = await venueApi.getById(selectedVenue.id);
      const updatedVenue = response.data;
      
      // Update info window content
      if (selectedVenue.infoWindow) {
        selectedVenue.infoWindow.setContent(
          createInfoWindowContent(updatedVenue)
        );
      }
      
      setCommentDialogOpen(false);
      setComment('');
      setRating(0);
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

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
          ${location.name}
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
          center: center,
          zoom: zoom,
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
          bounds.extend(position);
          validMarkers++;

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
  }, [markers, center, zoom, onMarkerClick, isAuthenticated]);

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

      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {selectedVenue?.comments && selectedVenue.comments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Previous Comments</Typography>
              <List>
                {selectedVenue.comments.map((comment, index) => (
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
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCommentSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GoogleMapComponent; 