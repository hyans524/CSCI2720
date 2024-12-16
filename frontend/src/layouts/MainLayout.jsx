import { AppBar, Box, Toolbar, Typography, IconButton, Button } from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Map as MapIcon,
  List as ListIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

function MainLayout({ children, isDarkMode, toggleDarkMode }) {
  const location = useLocation();

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
        overflow: 'hidden' // Prevent scrolling on the main container
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

            <Button
              component={RouterLink}
              to="/login"
              color="inherit"
              startIcon={<LoginIcon />}
              sx={{ ml: 2 }}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Toolbar spacer */}
      <Toolbar />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: 'calc(100vh - 64px)', // Subtract AppBar height
          width: '100%',
          position: 'relative',
          overflow: 'hidden', // Prevent content overflow
          display: 'flex',
          flexDirection: 'column',
          bgcolor: (theme) => theme.palette.background.default
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default MainLayout; 