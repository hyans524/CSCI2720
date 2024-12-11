import { useState } from 'react';
import { Routes, Route, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Place as PlaceIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Mock data
const mockUsers = [
  { id: 1, username: 'user1', createdAt: '2023-12-01' },
  { id: 2, username: 'user2', createdAt: '2023-12-05' },
];

const mockLocations = [
  {
    id: 1,
    name: 'Hong Kong Cultural Centre',
    address: '10 Salisbury Road, Tsim Sha Tsui',
    eventCount: 15,
  },
  {
    id: 2,
    name: 'Hong Kong City Hall',
    address: '5 Edinburgh Place, Central',
    eventCount: 12,
  },
];

// Overview component
function Overview() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Statistics
          </Typography>
          <Typography variant="h3">{mockUsers.length}</Typography>
          <Typography color="text.secondary">Total Users</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Venue Statistics
          </Typography>
          <Typography variant="h3">{mockLocations.length}</Typography>
          <Typography color="text.secondary">Total Venues</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// User Management component
function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [showAlert, setShowAlert] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.id !== id));
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: '' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingUser) {
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, username: formData.username }
          : user
      ));
    } else {
      setUsers([...users, {
        id: users.length + 1,
        username: formData.username,
        createdAt: new Date().toISOString().split('T')[0],
      }]);
    }
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({ username: '', password: '' });
  };

  return (
    <>
      {showAlert && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Operation successful
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', password: '' });
            setDialogOpen(true);
          }}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.createdAt}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(user.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Location Management component
function LocationManagement() {
  const [locations, setLocations] = useState(mockLocations);
  const [showAlert, setShowAlert] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const handleDelete = (id) => {
    setLocations(locations.filter(location => location.id !== id));
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingLocation) {
      setLocations(locations.map(location =>
        location.id === editingLocation.id
          ? { ...location, ...formData }
          : location
      ));
    } else {
      setLocations([...locations, {
        id: locations.length + 1,
        ...formData,
        eventCount: 0,
      }]);
    }
    setDialogOpen(false);
    setEditingLocation(null);
    setFormData({ name: '', address: '' });
  };

  return (
    <>
      {showAlert && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Operation successful
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingLocation(null);
            setFormData({ name: '', address: '' });
            setDialogOpen(true);
          }}
        >
          Add Venue
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Venue Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Event Count</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.address}</TableCell>
                <TableCell>{location.eventCount}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(location)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(location.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingLocation ? 'Edit Venue' : 'Add Venue'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Venue Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// 主要儀表板組件
function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '' },
    { text: 'User Management', icon: <PeopleIcon />, path: 'users' },
    { text: 'Venue Management', icon: <PlaceIcon />, path: 'locations' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* 側邊菜單 */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ width: '100%' }}>
            <List component="nav">
              {menuItems.map((item, index) => (
                <ListItem
                  button
                  key={item.text}
                  selected={selectedIndex === index}
                  onClick={() => {
                    setSelectedIndex(index);
                    navigate(`/admin/${item.path}`);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 主要內容區域 */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/locations" element={<LocationManagement />} />
            </Routes>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminDashboard; 