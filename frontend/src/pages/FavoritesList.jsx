import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Rating
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Map as MapIcon,
  Favorite as FavoriteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { venueApi, authApi } from '../services/api';

function FavoritesList() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchFavorites = async (retry = false) => {
    try {
      setLoading(true);
      setError(null);

      // Add a small delay if this is a retry attempt
      if (retry) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await authApi.getFavorites();
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

      const favoriteVenues = await Promise.all(
        response.data.map(async (favorite) => {
          try {
            const venueId = typeof favorite === 'string' ? favorite : favorite._id;
            const venueResponse = await venueApi.getById(venueId);
            return venueResponse.data;
          } catch (err) {
            console.error(`Failed to fetch venue details: ${err.message}`);
            return null;
          }
        })
      );

      // Filter out any null values from failed venue fetches
      const validFavorites = favoriteVenues.filter(venue => venue !== null);
      setFavorites(validFavorites);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      
      // If we haven't exceeded max retries and the error is potentially temporary
      if (retryCount < maxRetries && (err.response?.status === 503 || !err.response)) {
        setRetryCount(prev => prev + 1);
        fetchFavorites(true);
        return;
      }

      setError(err.response?.data?.message || 'Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authApi.isAuthenticated();
      setIsAuthenticated(isAuth);
      return isAuth;
    };

    if (checkAuth()) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, []);

  // Add a refresh button
  const handleRefresh = () => {
    fetchFavorites();
  };

  const handleRemoveFavorite = async (venueId) => {
    try {
      await authApi.removeFavorite(venueId);
      setFavorites(favorites.filter(venue => venue._id !== venueId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      alert('Failed to remove from favorites');
    }
  };

  const handleViewOnMap = (venueId) => {
    navigate(`/map?location=${venueId}`);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            My Favorite Venues
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Please log in to view and manage your favorite venues.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Log In
          </Button>
        </Paper>
      </Box>
    );
  }

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
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FavoriteIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">
              Favourite
            </Typography>
          </Box>
          <Button
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => fetchFavorites()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!loading && !error && favorites.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No favourite venues yet
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/map')}
              sx={{ mt: 2 }}
            >
              Explore Venues
            </Button>
          </Box>
        ) : (
          <List>
            {favorites.map((venue) => (
              <ListItem
                key={venue._id}
                sx={{
                  mb: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      {venue.venueName}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {venue.address}
                      </Typography>
                      {venue.averageRating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Rating
                            value={venue.averageRating}
                            readOnly
                            size="small"
                            precision={0.5}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({venue.comments?.length || 0} reviews)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="view on map"
                    onClick={() => handleViewOnMap(venue._id)}
                    sx={{ mr: 1 }}
                  >
                    <MapIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="remove from favorites"
                    onClick={() => handleRemoveFavorite(venue._id)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}

export default FavoritesList; 