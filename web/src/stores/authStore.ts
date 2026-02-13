'use client';

import { create } from 'zustand';
import api from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  schoolId?: string;
  board: string;
  isAdmin?: boolean;
  isVerified: boolean;
  children: any[];
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verifiedEmail: string | null;

  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<{ isNewUser: boolean }>;
  register: (data: any) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  verifiedEmail: null,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  },

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

      // Existing user — store tokens
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
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

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      set({
        user: result.user,
        isAuthenticated: true,
        verifiedEmail: null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const { data } = await api.get('/users/me');
      const user = data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, verifiedEmail: null });
  },
}));
