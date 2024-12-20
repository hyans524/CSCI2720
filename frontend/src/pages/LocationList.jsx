/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/


import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Map as MapIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { venueApi, authApi } from '../services/api';

function LocationList() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    category: '',
    latitude: '',
    longitude: '',
  });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [orderBy, setOrderBy] = useState('eventCount');
  const [order, setOrder] = useState('desc');
  const [category, setCategory] = useState('all');
  const [distance, setDistance] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [categories, setCategories] = useState([
    'Concert Hall',
    'Theater',
    'Exhibition Center',
    'Stadium',
    'Conference Center'
  ]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredLocations = useMemo(() => {
    return venues.filter(venue => {
      const categoryMatch = category === 'all' || venue.category === category;
      
      let distanceMatch = true;
      if (userLocation && venue.latitude && venue.longitude) {
        const locationDistance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          venue.latitude,
          venue.longitude
        );
        distanceMatch = locationDistance <= distance;
      }

      return categoryMatch && distanceMatch;
    });
  }, [venues, category, distance, userLocation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const venuesResponse = await venueApi.getAll();
        
        // Then fetch events for each venue
        const venuesWithEventCount = await Promise.all(
          venuesResponse.data.map(async (venue) => {
            try {
              const eventsResponse = await venueApi.getEvents(venue._id);
              
              // Extract category from venue name
              const categoryMatch = venue.venueName.match(/\((.*?)\)$/);
              const extractedCategory = categoryMatch ? categoryMatch[1] : null;
              
              return {
                ...venue,
                category: extractedCategory,
                eventCount: eventsResponse.data.length || 0
              };
            } catch (err) {
              console.error(`Failed to fetch events for venue ${venue._id}:`, err);
              const categoryMatch = venue.venueName.match(/\((.*?)\)$/);
              const extractedCategory = categoryMatch ? categoryMatch[1] : null;
              
              return {
                ...venue,
                category: extractedCategory,
                eventCount: 0
              };
            }
          })
        );

        setVenues(venuesWithEventCount);
        
        // Update categories state based on actual venue categories
        const uniqueCategories = [...new Set(
          venuesWithEventCount
            .map(venue => venue.category)
            .filter(category => category) // Remove null/undefined
        )];
        setCategories(uniqueCategories);

        if (isAuthenticated) {
          const favoritesResponse = await authApi.getFavorites();
          setFavorites(favoritesResponse.data || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load venues');
        setLoading(false);
      }
    };

    const checkAuth = () => {
      const isAuth = authApi.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        setIsAdmin(authApi.isAdmin());
      }
      return isAuth;
    };

    checkAuth();
    fetchData();
  }, [isAuthenticated]);

  // Admin functions
  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      venueName: venue.venueName,
      address: venue.address,
      category: venue.category || '',
      latitude: venue.latitude || '',
      longitude: venue.longitude || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      try {
        await venueApi.delete(venueId);
        setVenues(venues.filter(venue => venue._id !== venueId));
      } catch (err) {
        console.error('Failed to delete venue:', err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingVenue) {
        await venueApi.update(editingVenue._id, formData);
        setVenues(venues.map(venue =>
          venue._id === editingVenue._id ? { ...venue, ...formData } : venue
        ));
      } else {
        const response = await venueApi.create(formData);
        setVenues([...venues, response.data]);
      }
      setDialogOpen(false);
      setEditingVenue(null);
      setFormData({ venueName: '', address: '', category: '', latitude: '', longitude: '' });
    } catch (err) {
      console.error('Failed to save venue:', err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleCommentSubmit = async () => {
    try {
      await venueApi.addComment(selectedVenue._id, {
        comment,
        rating,
      });
      
      // Refresh venue data to show new comment
      const response = await venueApi.getAll();
      setVenues(response.data);
      
      setCommentDialogOpen(false);
      setComment('');
      setRating(0);
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  const handleFavoriteToggle = async (venueId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      let response;
      const isFavorited = favorites.some(fav => 
        (typeof fav === 'string' ? fav : fav._id) === venueId
      );
      
      if (isFavorited) {
        response = await authApi.removeFavorite(venueId);
        setFavorites(response.data);
      } else {
        response = await authApi.addFavorite(venueId);
        setFavorites(response.data);
      }
    } catch (err) {
      console.error('Failed to update favorites:', err);
      // Refresh favorites to ensure consistency
      try {
        const response = await authApi.getFavorites();
        setFavorites(response.data || []);
      } catch (refreshErr) {
        console.error('Failed to refresh favorites:', refreshErr);
      }
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedVenues = [...venues].sort((a, b) => {
    if (orderBy === 'eventCount') {
      const aCount = a.eventCount || 0;
      const bCount = b.eventCount || 0;
      return (order === 'asc' ? 1 : -1) * (aCount - bCount);
    }
    return 0;
  });

  const filteredVenues = sortedVenues.filter(venue => {
    // Text search filter
    const textMatch = 
      venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchTerm.toLowerCase());

    // Debug log to see what categories venues have
    console.log('Venue:', venue.venueName, 'Category:', venue.category, 'Selected:', category);

    // Category filter - handle case when venue has no category
    const categoryMatch = category === 'all' || 
      (venue.category ? venue.category.toLowerCase() === category.toLowerCase() : false);
    
    // Distance filter
    let distanceMatch = true;
    if (userLocation && venue.latitude && venue.longitude) {
      const locationDistance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        venue.latitude,
        venue.longitude
      );
      distanceMatch = locationDistance <= distance;
    }

    return textMatch && categoryMatch && distanceMatch;
  });

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
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Venue List
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search venues..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ width: 200 }}>
            <Typography variant="body2" gutterBottom>
              Distance: {distance} km
            </Typography>
            <Slider
              value={distance}
              onChange={(e, newValue) => setDistance(newValue)}
              min={1}
              max={50}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}km`}
              size="small"
            />
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingVenue(null);
                setFormData({ venueName: '', address: '', category: '', latitude: '', longitude: '' });
                setDialogOpen(true);
              }}
              sx={{ ml: 'auto' }}
            >
              Add Venue
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Venue Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'eventCount'}
                    direction={order}
                    onClick={() => handleSort('eventCount')}
                  >
                    Events
                    {orderBy === 'eventCount' && (
                      <Box component="span" sx={{ display: 'none' }}>
                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVenues
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((venue) => (
                  <TableRow key={venue._id} hover>
                    <TableCell>{venue.venueName}</TableCell>
                    <TableCell>{venue.address}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                        {venue.eventCount || 0}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => navigate(`/map?location=${venue._id}`)}
                        color="primary"
                        title="View on Map"
                      >
                        <MapIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleFavoriteToggle(venue._id)}
                        color="primary"
                        title={favorites.some(fav => 
                          (typeof fav === 'string' ? fav : fav._id) === venue._id
                        ) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        {favorites.some(fav => 
                          (typeof fav === 'string' ? fav : fav._id) === venue._id
                        ) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                      </IconButton>
                      {isAdmin && (
                        <>
                          <IconButton
                            onClick={() => handleEdit(venue)}
                            color="primary"
                            title="Edit Venue"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(venue._id)}
                            color="error"
                            title="Delete Venue"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredVenues.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingVenue ? 'Edit Venue' : 'Add Venue'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Venue Name"
            fullWidth
            value={formData.venueName}
            onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              label="Category"
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Latitude"
            fullWidth
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Longitude"
            fullWidth
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
          {selectedVenue?.comments && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Previous Comments</Typography>
              <List>
                {selectedVenue.comments.map((comment, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>{comment.username[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography component="span">{comment.username}</Typography>
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

export default LocationList; 