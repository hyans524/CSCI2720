import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Paper, Typography, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import GoogleMap from '../components/GoogleMap';
import { venueApi } from '../services/api';

function LocationMap() {
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapContainerRef = useRef(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative'
  };

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

  const mapCenter = selectedVenue
    ? { lat: selectedVenue.latitude, lng: selectedVenue.longitude }
    : { lat: 22.3193, lng: 114.1694 }; // Hong Kong center position

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Paper
        sx={{
          width: 300,
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
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
              onClick={() => setSelectedVenue(venue)}
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
          display: 'flex',
          position: 'relative',
          height: 'calc(100vh - 64px)',
          width: 'calc(100% - 300px)', // Subtract sidebar width
          '& > *': { // Target all children
            width: '100%',
            height: '100%'
          }
        }}
      >
        <GoogleMap
          center={mapCenter}
          zoom={selectedVenue ? 15 : 11}
          markers={venues.map(venue => ({
            id: venue._id,
            lat: parseFloat(venue.latitude),
            lng: parseFloat(venue.longitude),
            name: venue.venueName,
            address: venue.address,
            eventCount: venue.eventCount || 0,
            selected: selectedVenue?._id === venue._id
          }))}
          onMarkerClick={(markerId) => {
            const venue = venues.find(v => v._id === markerId);
            setSelectedVenue(venue);
          }}
        />
      </Box>
    </Box>
  );
}

export default LocationMap; 