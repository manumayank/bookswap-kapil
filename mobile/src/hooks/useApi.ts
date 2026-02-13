import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Listing, BookRequest, Match, School, PaginatedResponse } from '../types';

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

// Requests
export function useMyRequests() {
  return useQuery({
    queryKey: ['myRequests'],
    queryFn: async () => {
      const { data } = await api.get('/requests');
      return data.data as BookRequest[];
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: any) => {
      const { data } = await api.post('/requests', request);
      return data.data as BookRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

export function useFloatRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/requests/${id}/float`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

// Matches
export function useMyMatches() {
  return useQuery({
    queryKey: ['myMatches'],
    queryFn: async () => {
      const { data } = await api.get('/matches');
      return data.data as Match[];
    },
  });
}

export function useAcceptMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/accept`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMatches'] });
    },
  });
}

export function useRejectMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/reject`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMatches'] });
    },
  });
}

export function useCompleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/matches/${id}/complete`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMatches'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}
