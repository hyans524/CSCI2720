import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Place as PlaceIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';

// Mock data
const mockFavorites = [
  {
    id: 1,
    name: 'Hong Kong Cultural Centre',
    address: '10 Salisbury Road, Tsim Sha Tsui',
    district: 'Kowloon',
    eventCount: 15,
  },
  {
    id: 2,
    name: 'Hong Kong City Hall',
    address: '5 Edinburgh Place, Central',
    district: 'Hong Kong Island',
    eventCount: 12,
  },
];

function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(mockFavorites);

  const handleRemove = (id) => {
    setFavorites(favorites.filter(favorite => favorite.id !== id));
  };

  if (favorites.length === 0) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          My Favorites
        </Typography>
        <Alert severity="info">
          You haven't added any venues to your favorites yet.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        My Favorites
      </Typography>
      
      <Grid container spacing={3}>
        {favorites.map((venue) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={venue.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {venue.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {venue.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {venue.district}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    {venue.eventCount} events
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlaceIcon />}
                  onClick={() => navigate(`/map?location=${venue.id}`)}
                >
                  View on Map
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemove(venue.id)}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Favorites; 