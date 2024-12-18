import { AppBar, Box, Toolbar, Typography, IconButton, Button, Menu, MenuItem, Badge } from '@mui/material';
import {
  NightlightRound as DarkModeIcon,
  WbSunny as LightModeIcon,
  Map as MapIcon,
  List as ListIcon,
  Login as LoginIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authApi } from '../services/api';

// Common styles
const commonIconStyles = {
  fontSize: 20,
  color: 'inherit'
};

const commonButtonStyles = {
  ml: 2,
  p: 1,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  }
};

const commonNavButtonStyles = {
  color: 'white',
  mx: 1,
  '&.active': {
    bgcolor: 'primary.dark',
  },
  py: 0.5,
  minHeight: 32
};

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
    { path: '/events', label: 'Event List', icon: <ListIcon /> },
    { path: '/favorites', label: 'Favourite', icon: <FavoriteIcon /> },
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
          width: '100%',
          height: 48
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: '48px !important',
            padding: '0 16px'
          }}
        >
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}
          >
            Cultural Events
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={!isAuthenticated && item.path === '/favorites' ? '/login' : item.path}
                startIcon={item.icon}
                sx={commonNavButtonStyles}
                className={location.pathname === item.path ? 'active' : ''}
              >
                {item.label}
              </Button>
            ))}

            <IconButton
              color="inherit"
              onClick={toggleDarkMode}
              sx={commonButtonStyles}
              aria-label="toggle theme"
              size="small"
            >
              {isDarkMode ? (
                <DarkModeIcon sx={commonIconStyles} />
              ) : (
                <LightModeIcon sx={commonIconStyles} />
              )}
            </IconButton>

            {isAuthenticated ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                  sx={commonButtonStyles}
                  size="small"
                >
                  <AccountIcon sx={commonIconStyles} />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Typography variant="body2">
                    {username}
                  </Typography>
                  {isAdmin && (
                    <AdminIcon sx={{ ml: 1, width: 16, height: 16 }} />
                  )}
                </Box>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 0.5
                    }
                  }}
                >
                  <MenuItem onClick={handleLogout} sx={{ py: 1, minHeight: 'auto' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                startIcon={<LoginIcon sx={commonIconStyles} />}
                sx={commonNavButtonStyles}
                size="small"
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar sx={{ minHeight: '48px !important' }} />

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