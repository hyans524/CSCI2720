import { AppBar, Box, Toolbar, Typography, IconButton, Button, Menu, MenuItem, Badge } from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Map as MapIcon,
  List as ListIcon,
  Login as LoginIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authApi } from '../services/api';

function MainLayout({ children, isDarkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authApi.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        setUsername(localStorage.getItem('username') || 'User');
        setIsAdmin(localStorage.getItem('isAdmin') === 'true');
      }
    };
    checkAuth();
  }, [location]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUsername('');
    setIsAdmin(false);
    navigate('/login');
    handleClose();
  };

  const navItems = [
    { path: '/locations', label: 'Venue List', icon: <ListIcon /> },
    { path: '/map', label: 'Map View', icon: <MapIcon /> },
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100%'
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 700,
            }}
          >
            Cultural Events
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: 'white',
                  mx: 1,
                  '&.active': {
                    bgcolor: 'primary.dark',
                  },
                }}
                className={location.pathname === item.path ? 'active' : ''}
              >
                {item.label}
              </Button>
            ))}

            <IconButton
              color="inherit"
              onClick={toggleDarkMode}
              sx={{ ml: 2 }}
              aria-label="toggle theme"
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {isAuthenticated ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                  sx={{ ml: 2 }}
                >
                  <AccountIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Typography variant="body1">
                    {username}
                  </Typography>
                  {isAdmin && (
                    <AdminIcon sx={{ ml: 1, width: 20, height: 20 }} />
                  )}
                </Box>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                startIcon={<LoginIcon />}
                sx={{ ml: 2 }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          overflow: 'auto',
          p: 3
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default MainLayout; 