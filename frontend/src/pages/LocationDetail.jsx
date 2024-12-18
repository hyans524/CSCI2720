/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Place as PlaceIcon,
  Event as EventIcon,
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import GoogleMapComponent from '../components/GoogleMap';

// Mock data - will be replaced with API calls later
const mockLocation = {
  id: 1,
  name: 'Hong Kong Cultural Centre',
  address: '10 Salisbury Road, Tsim Sha Tsui',
  district: 'Kowloon',
  lat: 22.293456,
  lng: 114.171959,
  eventCount: 15,
  description: 'A major performing arts facility in Hong Kong, opened in 1989.',
  events: [
    {
      id: 1,
      title: 'Symphony Orchestra Concert',
      date: '2024-03-15',
      time: '19:30',
      type: 'Concert',
    },
    {
      id: 2,
      title: 'Modern Dance Performance',
      date: '2024-03-20',
      time: '20:00',
      type: 'Dance',
    },
  ],
};

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Simulating API call
    setLocation(mockLocation);
  }, [id]);

  if (!location) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h4" gutterBottom>
                {location.name}
              </Typography>
              <IconButton
                onClick={() => setIsFavorite(!isFavorite)}
                color={isFavorite ? 'error' : 'default'}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PlaceIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" color="text.secondary">
                {location.address}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" color="text.secondary">
                {location.eventCount} events
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              {location.description}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Events
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {location.events.map((event) => (
              <Card key={event.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.type}
                  </Typography>
                  <Typography variant="body2">
                    {event.date} at {event.time}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ height: 400 }}>
            <GoogleMapComponent
              markers={[{
                id: location.id,
                name: location.name,
                address: location.address,
                lat: location.lat,
                lng: location.lng,
                eventCount: location.eventCount,
              }]}
              selectedLocation={{
                lat: location.lat,
                lng: location.lng,
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default LocationDetail; 