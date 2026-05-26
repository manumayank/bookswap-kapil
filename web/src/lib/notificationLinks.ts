type NotificationLike = {
  type: string;
  data?: Record<string, any> | null;
};

export function getNotificationLink(n: NotificationLike): string {
  const listingId = n.data?.listingId;
  switch (n.type) {
    case 'LISTING_SUBMITTED':
    case 'LISTING_REJECTED':
      return '/dashboard';
    case 'LISTING_APPROVED':
    case 'NEW_MATCH_FOR_REQUEST':
      return listingId ? `/listings/${listingId}` : '/dashboard';
    case 'DEAL_REQUESTED':
    case 'DEAL_ACCEPTED':
    case 'DEAL_COMPLETED':
    case 'DEAL_CANCELLED':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export function formatRelativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
