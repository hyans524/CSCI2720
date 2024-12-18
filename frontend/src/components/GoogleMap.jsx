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

// Separate map renderer component with memoization
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

// Separate comment dialog component with memoization
const CommentDialog = React.memo(({ open, onClose, venue, isAuthenticated }) => {
  const [localComment, setLocalComment] = useState('');
  const [localRating, setLocalRating] = useState(0);

  // Memoize dialog content to prevent unnecessary re-renders
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

  // Reset form when dialog closes
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
  const infoWindowRef = useRef(null);
  const [error, setError] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Memoize callback functions
  const handleDialogClose = useCallback(() => {
    setCommentDialogOpen(false);
  }, []);

  const createInfoWindowContent = useCallback((location) => {
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
  }, [isAuthenticated]);

  // Memoize map initialization configuration
  const mapConfig = useMemo(() => {
    const config = {
      ...DEFAULT_MAP_CONFIG,
      ...options,
      center,
      zoom,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControl: true,
      fullscreenControl: false,
      scaleControl: false,
      rotateControl: false,
      panControl: false,
      myLocationButton: true,
      myLocationControl: true
    };

    // Add Google Maps specific configurations only when the Google object is available
    if (window.google?.maps) {
      config.zoomControlOptions = {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      };
      config.mapTypeControlOptions = {
        style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU
      };
    }

    return config;
  }, [options, center, zoom]);

  // Memoize marker click handler
  const handleMarkerClick = useCallback((location, marker, map) => {
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
    
    infoWindowRef.current.setContent(createInfoWindowContent(location));
    infoWindowRef.current.open(map, marker);

    // Add event listener for the Add Comment button after info window is opened
    google.maps.event.addListener(infoWindowRef.current, 'domready', () => {
      const addCommentBtn = document.getElementById('addCommentBtn');
      if (addCommentBtn) {
        addCommentBtn.addEventListener('click', () => {
          setSelectedVenue({ ...location, infoWindow: infoWindowRef.current });
          setCommentDialogOpen(true);
        });
      }
    });

    if (onMarkerClick) {
      onMarkerClick(location._id);
    }

    map.setZoom(MAP_ZOOM_LEVELS.BUILDING);
    map.panTo(marker.getPosition());
  }, [createInfoWindowContent, onMarkerClick]);

  // Initialize map effect
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key is missing');
        }

        const google = await loader.load();
        
        if (!isMounted) return;

        if (!mapInstanceRef.current && mapRef.current) {
          const finalConfig = {
            ...mapConfig,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            }
          };
          mapInstanceRef.current = new google.maps.Map(mapRef.current, finalConfig);
        }

        // Update map zoom and center
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(zoom);
          mapInstanceRef.current.setCenter(center);
        }

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        
        if (!isMounted) return;

        // Process markers
        markers.forEach(location => {
          const lat = parseFloat(location.latitude || location.lat);
          const lng = parseFloat(location.longitude || location.lng);
          
          if (!isValidCoordinates(lat, lng)) {
            console.error('Invalid coordinates for location:', location);
            return;
          }

          const pinElement = new PinElement({
            background: location.selected ? "#ff4444" : "#1976d2",
            borderColor: location.selected ? "#cc0000" : "#1565c0",
            glyphColor: "#FFFFFF",
            scale: location.selected ? 1.2 : 1,
            glyph: `${location.eventCount || ''}`,
          });

          const position = { lat, lng };
          const marker = new AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position,
            title: location.venueName || location.name,
            content: pinElement.element,
          });

          if (location.selected) {
            marker.content.style.animation = 'bounce 0.5s infinite alternate';
          }

          marker.addListener('click', () => handleMarkerClick(location, marker, mapInstanceRef.current));
          markersRef.current.push(marker);
        });
      } catch (err) {
        console.error('Error initializing map:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize Google Maps');
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      // Clean up markers when component unmounts
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [mapConfig, markers, handleMarkerClick]);

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  // Helper functions
  const isValidCoordinates = useCallback((lat, lng) => {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180 &&
           lat >= 22.1 && lat <= 22.6 && // Extended Hong Kong latitude range
           lng >= 113.8 && lng <= 114.4;  // Hong Kong longitude range
  }, []);

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