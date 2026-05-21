import axios from 'axios';

// NEXT_PUBLIC_API_URL is required — there is no safe fallback. A hardcoded
// production URL would silently send dev / preview / test traffic at the
// live API. Fail loudly at startup instead.
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
