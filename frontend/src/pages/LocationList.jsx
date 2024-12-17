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

  // Fetch venue data and user favorites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesResponse, favoritesResponse] = await Promise.all([
          venueApi.getAll(),
          isAuthenticated ? authApi.getFavorites() : Promise.resolve({ data: [] })
        ]);
        setVenues(venuesResponse.data);
        setFavorites(favoritesResponse.data || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Check user permissions
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setIsAdmin(authApi.isAdmin());
    }
  }, []);

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
      if (favorites.includes(venueId)) {
        await authApi.removeFavorite(venueId);
        setFavorites(favorites.filter(id => id !== venueId));
      } else {
        await authApi.addFavorite(venueId);
        setFavorites([...favorites, venueId]);
      }
    } catch (err) {
      console.error('Failed to update favorites:', err);
    }
  };

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

  const filteredVenues = venues.filter(venue =>
    venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Venue List
        </Typography>
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

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search venues..."
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} sx={{ flexGrow: 1, mb: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Venue Name</TableCell>
              <TableCell>Address</TableCell>
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
                  <TableCell align="center">
                    <IconButton
                      onClick={() => navigate(`/map?location=${venue._id}`)}
                      color="primary"
                      title="View on Map"
                    >
                      <MapIcon />
                    </IconButton>
                    {isAuthenticated && (
                      <>
                        <IconButton
                          onClick={() => {
                            setSelectedVenue(venue);
                            setCommentDialogOpen(true);
                          }}
                          color="primary"
                          title="Add Comment"
                        >
                          <CommentIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleFavoriteToggle(venue._id)}
                          color="primary"
                          title={favorites.includes(venue._id) ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          {favorites.includes(venue._id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </>
                    )}
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