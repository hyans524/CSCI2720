import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress, 
  Alert,
  TextField,
  Button,
  Rating,
  Divider,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleMap from '../components/GoogleMap';
import { venueApi, authApi } from '../services/api';
import { MAP_ZOOM_LEVELS, DEFAULT_MAP_CONFIG } from '../services/googleMaps';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

function LocationMap() {
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM_LEVELS.TERRITORY);
  const [favorites, setFavorites] = useState([]);

  const mapContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await venueApi.getAll();
        setVenues(response.data);
        
        const locationId = searchParams.get('location');
        if (locationId) {
          const venue = response.data.find(v => v._id === locationId);
          if (venue) {
            setSelectedVenue(venue);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load venues');
        setLoading(false);
      }
    };

    fetchVenues();
  }, [searchParams]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (isAuthenticated) {
        try {
          const response = await authApi.getFavorites();
          setFavorites(response.data);
        } catch (err) {
          console.error('Failed to fetch favorites:', err);
        }
      }
    };

    fetchFavorites();
  }, [isAuthenticated]);

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please login to add a comment');
      return;
    }

    if (!comment.trim() || !rating) {
      alert('Please provide both a comment and rating');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add a comment');
        return;
      }

      // Get current user's username from localStorage
      const username = localStorage.getItem('username');
      if (!username) {
        alert('User information not found. Please login again.');
        return;
      }

      await venueApi.addComment(selectedVenue._id, {
        comment: comment.trim(),
        rating: Number(rating),
        username: username
      });
      
      // Refresh venue data to update comments
      const response = await venueApi.getAll();
      setVenues(response.data);
      const updatedVenue = response.data.find(v => v._id === selectedVenue._id);
      setSelectedVenue(updatedVenue);
      
      // Clear form
      setComment('');
      setRating(0);

      // Show success message
      alert('Comment added successfully');
    } catch (err) {
      console.error('Failed to submit comment:', err);
      if (err.response?.status === 401) {
        alert('Please login to add a comment');
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to add comment. Please try again.';
        console.error('Error details:', err.response?.data);
        alert(errorMessage);
      }
    }
  };

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    if (venue) {
      setMapZoom(MAP_ZOOM_LEVELS.BUILDING);
    }
  };

  const handleCloseVenue = () => {
    setSelectedVenue(null);
    setMapZoom(MAP_ZOOM_LEVELS.TERRITORY);
  };

  const handleFavoriteToggle = async (venue) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (favorites.includes(venue._id)) {
        await authApi.removeFavorite(venue._id);
        setFavorites(favorites.filter(id => id !== venue._id));
      } else {
        await authApi.addFavorite(venue._id);
        setFavorites([...favorites, venue._id]);
      }
    } catch (err) {
      console.error('Failed to update favorites:', err);
      alert('Failed to update favorites');
    }
  };

  const mapCenter = selectedVenue
    ? { lat: parseFloat(selectedVenue.latitude), lng: parseFloat(selectedVenue.longitude) }
    : DEFAULT_MAP_CONFIG.center;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 64px)', 
      position: 'fixed',
      width: '100%',
      top: 64,
      left: 0,
      overflow: 'hidden'
    }}>
      <Paper
        elevation={3}
        sx={{
          width: 250,
          height: '100%',
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
          zIndex: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <List>
          <ListItem>
            <Typography variant="h6">Venue List</Typography>
          </ListItem>
          {venues.map((venue) => (
            <ListItem
              key={venue._id}
              button
              selected={selectedVenue?._id === venue._id}
              onClick={() => handleVenueSelect(venue)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemText
                primary={venue.venueName}
                secondary={venue.address}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box 
        ref={mapContainerRef}
        sx={{ 
          flexGrow: 1,
          position: 'relative',
          height: '100%',
          display: 'flex'
        }}
      >
        <Box sx={{ 
          width: selectedVenue ? 'calc(100% - 300px)' : '100%',
          height: '100%',
          position: 'relative',
          transition: 'width 0.3s ease'
        }}>
          <GoogleMap
            center={mapCenter}
            zoom={mapZoom}
            options={{
              ...DEFAULT_MAP_CONFIG,
              center: mapCenter,
              zoom: mapZoom,
            }}
            markers={venues.map(venue => ({
              id: venue._id,
              _id: venue._id,
              lat: parseFloat(venue.latitude || venue.lat),
              lng: parseFloat(venue.longitude || venue.lng),
              name: venue.venueName,
              venueName: venue.venueName,
              address: venue.address,
              eventCount: venue.eventCount || 0,
              selected: selectedVenue?._id === venue._id,
              comments: venue.comments,
              averageRating: venue.averageRating
            }))}
            onMarkerClick={(markerId) => {
              const venue = venues.find(v => v._id === markerId);
              if (venue) {
                handleVenueSelect(venue);
              }
            }}
          />
        </Box>

        {selectedVenue && (
          <Paper
            elevation={3}
            sx={{
              width: 300,
              height: '100%',
              overflow: 'auto',
              borderLeft: 1,
              borderColor: 'divider',
              p: 2,
              position: 'relative',
              transition: 'transform 0.3s ease',
              transform: selectedVenue ? 'translateX(0)' : 'translateX(100%)'
            }}
          >
            <IconButton
              onClick={handleCloseVenue}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 1
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  {selectedVenue.venueName}
                </Typography>
                <IconButton
                  onClick={() => handleFavoriteToggle(selectedVenue)}
                  color="primary"
                >
                  {favorites.includes(selectedVenue._id) ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedVenue.address}
              </Typography>

              {selectedVenue.averageRating && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={selectedVenue.averageRating} readOnly precision={0.5} size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({selectedVenue.comments?.length || 0} reviews)
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Add Review
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography component="legend" variant="body2">Rating</Typography>
                <Rating
                  value={rating}
                  onChange={(event, newValue) => {
                    setRating(newValue);
                  }}
                  size="small"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Write your review..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />

              <Button
                variant="contained"
                onClick={handleCommentSubmit}
                disabled={!isAuthenticated || !comment || !rating}
                fullWidth
                size="small"
              >
                Submit Review
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                All Reviews
              </Typography>

              {selectedVenue.comments?.length > 0 ? (
                <List dense>
                  {selectedVenue.comments.map((comment, index) => (
                    <ListItem key={index} sx={{ display: 'block', py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ mr: 1 }}>
                          {comment.user.username}
                        </Typography>
                        <Rating value={comment.rating} readOnly size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {comment.comment}
                      </Typography>
                      {index < selectedVenue.comments.length - 1 && (
                        <Divider sx={{ my: 1 }} />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet
                </Typography>
              )}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default LocationMap; 