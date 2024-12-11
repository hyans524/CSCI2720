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
} from '@mui/material';
import {
  Search as SearchIcon,
  Map as MapIcon,
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
  const [favorites, setFavorites] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 獲取場地數據
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await venueApi.getAll();
        setVenues(response.data);
        setLoading(false);
      } catch (err) {
        setError('無法載入場地數據');
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // 獲取收藏數據
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const fetchFavorites = async () => {
        try {
          const response = await authApi.getFavorites();
          setFavorites(response.data.map(venue => venue._id));
        } catch (err) {
          console.error('無法載入收藏數據:', err);
        }
      };
      fetchFavorites();
    }
  }, []);

  // 處理收藏切換
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
      console.error('無法更新收藏:', err);
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
    venue.venueName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Venue List
      </Typography>

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
                    <IconButton
                      onClick={() => handleFavoriteToggle(venue._id)}
                      color="secondary"
                      title={favorites.includes(venue._id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      {favorites.includes(venue._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
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
    </Box>
  );
}

export default LocationList; 