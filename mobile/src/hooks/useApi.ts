import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Listing, Deal, School, PaginatedResponse } from '../types';

// Schools
export function useSchools(query?: { name?: string; city?: string; board?: string }) {
  return useQuery({
    queryKey: ['schools', query],
    queryFn: async () => {
      const { data } = await api.get('/schools', { params: query });
      return data as PaginatedResponse<School>;
    },
  });
}

// Listings
export function useListings(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const { data } = await api.get('/listings', { params: filters });
      return data as PaginatedResponse<Listing>;
    },
    enabled: filters !== undefined,
  });
}

export function useRecentListings(limit: number = 4) {
  return useQuery({
    queryKey: ['listings', 'recent', limit],
    queryFn: async () => {
      const { data } = await api.get('/listings', { params: { limit, sortBy: 'newest' } });
      return data as PaginatedResponse<Listing>;
    },
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const { data } = await api.get('/listings/my');
      return data.data as Listing[];
    },
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`);
      return data.data as Listing;
    },
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listing: any) => {
      const { data } = await api.post('/listings', listing);
      return data.data as Listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// Deals (matches)
export function useMyDeals() {
  return useQuery({
    queryKey: ['myDeals'],
    queryFn: async () => {
      const { data } = await api.get('/matches');
      return data.data as Deal[];
    },
  });
}

// Alias for backward compat
export const useMyMatches = useMyDeals;

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { listingId: string; offeredPrice?: number }) => {
      const { data } = await api.post('/matches', params);
      return data.data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeals'] });
    },
  });
}

export function useAcceptDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/accept`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeals'] });
    },
  });
}

// Backward compat alias
export const useAcceptMatch = useAcceptDeal;

export function useRejectDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/reject`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeals'] });
    },
  });
}

export const useRejectMatch = useRejectDeal;

export function useCompleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/complete`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeals'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    },
  });
}

export const useCompleteMatch = useCompleteDeal;

export function useCancelDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/cancel`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeals'] });
    },
  });
}
