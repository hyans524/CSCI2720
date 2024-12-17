import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for handling auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth data on unauthorized
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('userId');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Venue-related APIs
export const venueApi = {
    getAll: () => api.get('/venues'),
    getById: (id) => api.get(`/venues/${id}`),
    create: (data) => api.post('/venues', data),
    update: (id, data) => api.put(`/venues/${id}`, data),
    delete: (id) => api.delete(`/venues/${id}`),
    getEvents: (id) => api.get(`/events/venue/${id}`),
    addComment: (venueId, data) => api.post(`/auth/comments`, { 
        venueId,
        comment: data.comment,
        rating: data.rating
    }),
    getComments: (id) => api.get(`/venues/${id}/comments`),
};

// Event-related APIs
export const eventApi = {
    getAll: () => api.get('/events'),
    getById: (id) => api.get(`/events/${id}`)
};

// Auth-related APIs
export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userId');
    },
    isAuthenticated: () => !!localStorage.getItem('token'),
    isAdmin: () => localStorage.getItem('isAdmin') === 'true',
    getCurrentUserId: () => localStorage.getItem('userId'),
    getFavorites: () => api.get('/auth/favorites'),
    addFavorite: (venueId) => api.post(`/auth/favorites/${venueId}`),
    removeFavorite: (venueId) => api.delete(`/auth/favorites/${venueId}`),
    getComments: () => api.get('/auth/comments'),
    getVenueComments: (venueId) => api.get(`/auth/comments/venue/${venueId}`),
    addComment: (data) => api.post('/auth/comments', data),
    updateComment: (commentId, data) => api.put(`/auth/comments/${commentId}`, data),
    deleteComment: (commentId) => api.delete(`/auth/comments/${commentId}`),
};

export default api; 