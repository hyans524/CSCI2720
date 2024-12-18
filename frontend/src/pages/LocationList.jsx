import { useState, useEffect } from 'react';
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
  });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [orderBy, setOrderBy] = useState('eventCount');
  const [order, setOrder] = useState('desc');

  // Fetch venue data and user favorites
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First fetch all venues
        const venuesResponse = await venueApi.getAll();
        
        // Then fetch events for each venue
        const venuesWithEventCount = await Promise.all(
          venuesResponse.data.map(async (venue) => {
            try {
              const eventsResponse = await venueApi.getEvents(venue._id);
              return {
                ...venue,
                eventCount: eventsResponse.data.length || 0
              };
            } catch (err) {
              console.error(`Failed to fetch events for venue ${venue._id}:`, err);
              return {
                ...venue,
                eventCount: 0
              };
            }
          })
        );

        setVenues(venuesWithEventCount);
        
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
      setFormData({ venueName: '', address: '' });
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

  const filteredVenues = sortedVenues.filter(venue =>
    venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingVenue(null);
                setFormData({ venueName: '', address: '' });
                setDialogOpen(true);
              }}
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