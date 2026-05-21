import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Resolve the API base URL from Expo config (set per build via app.json /
// EXPO_PUBLIC_API_URL) so dev / staging / prod don't all point at the same
// host by accident. Throw early at startup if it's missing — better to fail
// loudly than to leak traffic to an unintended environment.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

if (!API_URL) {
  throw new Error(
    'API base URL not configured. Set EXPO_PUBLIC_API_URL or expo.extra.apiUrl in app.json.'
  );
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Attach JWT token to every request. We do NOT log the token (or any prefix
// of it) — device logs get collected by crash reporters and support tooling,
// and even a 20-char JWT prefix narrows brute-force significantly.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, clear auth and reject
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (data.success) {
          await AsyncStorage.setItem('accessToken', data.data.accessToken);
          await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, clear tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
