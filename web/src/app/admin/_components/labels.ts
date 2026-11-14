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
  STATE: 'State board',
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

/** Status badge class (pencil-box .badge-* variants; theme-aware via tokens). */
export { statusBadgeClass } from '@/components/app/status';

/** Extracts the API error message from an axios error. */
export function errorMessage(err: unknown, fallback = 'That didn’t work. Try again.'): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string } | null;
  return e?.response?.data?.error || e?.message || fallback;
}
