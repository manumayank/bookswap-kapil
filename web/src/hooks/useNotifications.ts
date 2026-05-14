import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  sentAt: string;
}

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

const KEY = ['notifications'] as const;

export function useNotifications(params: { page?: number; limit?: number; enabled?: boolean } = {}) {
  const { page = 1, limit = 20, enabled = true } = params;

  return useQuery({
    queryKey: [...KEY, page, limit],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { page, limit } });
      // Backend response shape: { success, data: Notification[], unreadCount, pagination }
      const body = res.data ?? {};
      const pagination = body.pagination ?? {};
      return {
        notifications: Array.isArray(body.data) ? body.data : [],
        total: pagination.total ?? 0,
        unreadCount: body.unreadCount ?? 0,
        page: pagination.page ?? page,
        limit: pagination.limit ?? limit,
      } as NotificationListResponse;
    },
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
