/*
Shuyang Song: 1155173859;
Tam Yiu Hei: 1155223226;
So Hiu Tung: 1155174920;
Marlen Runz: 1155232588
*/

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useState } from 'react';
import { createTheme } from '@mui/material/styles';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LocationList from './pages/LocationList';
import LocationMap from './pages/LocationMap';
import LocationDetail from './pages/LocationDetail';
import Login from './pages/Login';
import EventList from './pages/EventList';
import FavoritesList from './pages/FavoritesList';
import UserList from './pages/UserList';

// Theme configuration
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}>
          <Routes>
            {/* Redirect root to locations */}
            <Route path="/" element={<Navigate to="/locations" replace />} />
            <Route path="/locations" element={<LocationList />} />
            <Route path="/map" element={<LocationMap />} />
            <Route path="/location/:id" element={<LocationDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/favorites" element={<FavoritesList />} />
            <Route path="/admin" element={<UserList />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
