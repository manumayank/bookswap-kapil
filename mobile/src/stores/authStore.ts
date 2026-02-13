import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verifiedEmail: string | null;

  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<{ isNewUser: boolean }>;
  register: (data: any) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  verifiedEmail: null,

  sendOtp: async (email: string) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/send-otp', { email });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      const result = data.data;

      if (result.isNewUser) {
        set({ verifiedEmail: email, isLoading: false });
        return { isNewUser: true };
      }

      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      return { isNewUser: false };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const { data: response } = await api.post('/users/register', data);
      const result = response.data;

      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      set({ user: result.user, isAuthenticated: true, verifiedEmail: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUser: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const { data } = await api.get('/users/me');
      set({ user: data.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    set({ user: null, isAuthenticated: false, verifiedEmail: null });
  },

  setUser: (user: User) => set({ user }),
}));
