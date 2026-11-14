// Human-readable labels for backend enums shown in the admin area.

const LABELS: Record<string, string> = {
  // ListingStatus / RequestStatus
  PENDING_APPROVAL: 'Pending approval',
  ACTIVE: 'Active',
  SOLD: 'Sold',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  OPEN: 'Open',
  MATCHED: 'Matched',
  FULFILLED: 'Fulfilled',
  // GrievanceStatus
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
  // BookCondition
  HARDLY_USED: 'Hardly used',
  WELL_MAINTAINED: 'Well maintained',
  MARKER_USED: 'Marker used',
  STAINS: 'Stains',
  TORN_PAGES: 'Torn pages',
  // Board
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  STATE: 'State Board',
  IB: 'IB',
  IGCSE: 'IGCSE',
  // Category
  BOOK: 'Book',
  STATIONERY: 'Stationery',
};

/** Label for an enum value; falls back to "SOME_VALUE" -> "Some value". */
export function enumLabel(value: string | null | undefined): string {
  if (!value) return '-';
  if (LABELS[value]) return LABELS[value];
  const spaced = value.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Status badge colours, readable in both light and dark mode. */
export const STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  ACTIVE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  OPEN: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  MATCHED: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  SOLD: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  FULFILLED: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  RESOLVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'bg-red-500/15 text-red-700 dark:text-red-300',
  CANCELLED: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  DISMISSED: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
};

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE[status] || 'bg-slate-500/15 text-slate-700 dark:text-slate-300';
}

/** Extracts the API error message from an axios error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string } | null;
  return e?.response?.data?.error || e?.message || fallback;
}
