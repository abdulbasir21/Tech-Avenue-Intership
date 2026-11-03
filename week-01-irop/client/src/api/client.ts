import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();
const API_URL = rawUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('irop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('irop_token');
      localStorage.removeItem('irop_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
