// Status enum -> pencil-box badge class, shared by the dashboard and admin.
// Sun = waiting on someone, green = live/good, primary = done, accent = refused,
// muted = closed.

const STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'badge-sun',
  PENDING: 'badge-sun',
  ACTIVE: 'badge-secondary',
  OPEN: 'badge-secondary',
  ACCEPTED: 'badge-secondary',
  RESOLVED: 'badge-secondary',
  MATCHED: 'badge-primary',
  SOLD: 'badge-primary',
  COMPLETED: 'badge-primary',
  FULFILLED: 'badge-primary',
  EXCHANGED: 'badge-primary',
  REJECTED: 'badge-accent',
  CANCELLED: 'badge-muted',
  DISMISSED: 'badge-muted',
};

export function statusBadgeClass(status?: string | null): string {
  return (status && STATUS_BADGE[status]) || 'badge-muted';
}

/** ₹ with Indian digit grouping. */
export function rupees(value?: number | string | null): string {
  if (value == null || value === '') return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return '';
  return `₹${n.toLocaleString('en-IN')}`;
}

export function shortDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
