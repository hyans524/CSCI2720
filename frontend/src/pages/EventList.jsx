/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/


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
import { eventApi, authApi } from '../services/api';

function EventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    presenter: '',
    venueId: '',
    date: '',
    description: ''
  });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [favorites, setFavorites] = useState([]);

  // Fetch event data and user favorites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, favoritesResponse] = await Promise.all([
          eventApi.getAll(),
          isAuthenticated ? authApi.getFavorites() : Promise.resolve({ data: [] })
        ]);
        setEvents(eventsResponse.data);
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
  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      presenter: event.presenter,
      venueId: event.venue.venueId,
      date: event.date,
      description: event.description
    });
    setDialogOpen(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventApi.delete(eventId);
        setEvents(events.filter(event => event.eventId !== eventId));
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingEvent) {
        await eventApi.update(editingEvent._id, formData);
        const [eventsResponse, favoritesResponse] = await Promise.all([
          eventApi.getAll(),
          isAuthenticated ? authApi.getFavorites() : Promise.resolve({ data: [] })
        ]);
        setEvents(eventsResponse.data);
      } else {
        const response = await eventApi.create(formData);
        const [eventsResponse, favoritesResponse] = await Promise.all([
          eventApi.getAll(),
          isAuthenticated ? authApi.getFavorites() : Promise.resolve({ data: [] })
        ]);
        setEvents(eventsResponse.data);
      }
      setDialogOpen(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        presenter: '',
        venueId: '',
        date: '',
        description: ''
      });
    } catch (err) {
      console.error('Failed to save event:', err);
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
      await eventApi.addComment(selectedEvent._id, {
        comment,
        rating,
      });

      // Refresh event data to show new comment
      const response = await eventApi.getAll();
      setEvents(response.data);

      setCommentDialogOpen(false);
      setComment('');
      setRating(0);
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  const handleFavoriteToggle = async (eventId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (favorites.includes(eventId)) {
        await authApi.removeFavorite(eventId);
        setFavorites(favorites.filter(id => id !== eventId));
      } else {
        await authApi.addFavorite(eventId);
        setFavorites([...favorites, eventId]);
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

  const filteredEvents = events.filter(event =>
    // event.title.toLowerCase().includes(searchTerm.toLowerCase())
    event.eventId.toString().includes(searchTerm.toString())
  );

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Event List
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingEvent(null);
              setFormData({
                title: '',
                presenter: '',
                venueId: '',
                date: '',
                description: ''
              });
              setDialogOpen(true);
            }}
          >
            Add Event
          </Button>
        )}
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search a event using eventId..."
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
              <TableCell>Event ID</TableCell>
              <TableCell>Event Title</TableCell>
              <TableCell>Presenter</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((event) => (
                <TableRow key={event._id} hover>
                  <TableCell>{event.eventId}</TableCell>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.presenter}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell align="center">

                    {isAuthenticated && (
                      <>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <IconButton
                          onClick={() => handleEdit(event)}
                          color="primary"
                          title="Read or Edit Event"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(event.eventId)}
                          color="error"
                          title="Delete Event"
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
        count={filteredEvents.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Add Event'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Presenter"
            fullWidth
            value={formData.presenter}
            onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            multiline
            fullWidth
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Venue ID"
            fullWidth
            value={formData.venueId}
            onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Date"
            fullWidth
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
          {selectedEvent?.comments && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Previous Comments</Typography>
              <List>
                {selectedEvent.comments.map((comment, index) => (
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

export default EventList; 