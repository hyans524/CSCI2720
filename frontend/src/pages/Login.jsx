import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { authApi } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const credentials = {
        username,
        password
      };

      const response = await authApi.login(credentials);
      
      if (response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('isAdmin', response.data.isAdmin);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('username', credentials.username);

        if (response.data.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/locations');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Login
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </form>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login; 