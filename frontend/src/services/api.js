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

// Venue-related APIs
export const venueApi = {
    getAll: () => api.get('/venues'),
    getById: (id) => api.get(`/venues/${id}`),
    create: (data) => api.post('/venues', data),
    update: (id, data) => api.put(`/venues/${id}`, data),
    delete: (id) => api.delete(`/venues/${id}`),
    getEvents: (id) => api.get(`/events/venue/${id}`)
};

// Event-related APIs
export const eventApi = {
    getAll: () => api.get('/events'),
    getById: (id) => api.get(`/events/${id}`)
};

// User-related APIs
export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    checkAdmin: () => api.get('/auth/check-admin')
};

export default api; 