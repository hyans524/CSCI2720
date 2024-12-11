import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 添加請求攔截器來處理認證
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

// 場地相關 API
export const venueApi = {
    getAll: () => api.get('/venues'),
    getById: (id) => api.get(`/venues/${id}`),
    getEvents: (id) => api.get(`/events/venue/${id}`)
};

// 事件相關 API
export const eventApi = {
    getAll: () => api.get('/events'),
    getById: (id) => api.get(`/events/${id}`)
};

// 用戶相關 API
export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getFavorites: () => api.get('/auth/favorites'),
    addFavorite: (venueId) => api.post(`/auth/favorites/${venueId}`),
    removeFavorite: (venueId) => api.delete(`/auth/favorites/${venueId}`)
};

export default api; 