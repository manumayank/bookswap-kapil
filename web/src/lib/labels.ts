// Human-readable labels for API enum values (see backend/prisma/schema.prisma).

const CONDITION: Record<string, string> = {
  HARDLY_USED: 'Hardly used',
  WELL_MAINTAINED: 'Well maintained',
  MARKER_USED: 'Marker used',
  STAINS: 'Has stains',
  TORN_PAGES: 'Torn pages',
};

const CATEGORY: Record<string, string> = {
  BOOK: 'Book',
  STATIONERY: 'Stationery',
};

const BOARD: Record<string, string> = {
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  STATE: 'State Board',
  IB: 'IB',
  IGCSE: 'IGCSE',
};

const STATUS: Record<string, string> = {
  PENDING_APPROVAL: 'Pending approval',
  ACTIVE: 'Active',
  SOLD: 'Sold',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  OPEN: 'Open',
  MATCHED: 'Matched',
  FULFILLED: 'Fulfilled',
};

const PICKUP: Record<string, string> = {
  SCHOOL_GATE: 'School gate',
  HOME: 'Home pickup',
  PUBLIC: 'Public place',
};

function humanize(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function lookup(map: Record<string, string>, value?: string | null): string {
  if (!value) return '';
  return map[value] ?? humanize(value);
}

export const conditionLabel = (v?: string | null) => lookup(CONDITION, v);
export const categoryLabel = (v?: string | null) => lookup(CATEGORY, v);
export const boardLabel = (v?: string | null) => lookup(BOARD, v);
export const statusLabel = (v?: string | null) => lookup(STATUS, v);
export const pickupLabel = (v?: string | null) => lookup(PICKUP, v);
export const enumLabel = (v?: string | null) => (v ? humanize(v) : '');

export const BOARD_OPTIONS = Object.keys(BOARD) as ('CBSE' | 'ICSE' | 'STATE' | 'IB' | 'IGCSE')[];
export const CATEGORY_OPTIONS = Object.keys(CATEGORY) as ('BOOK' | 'STATIONERY')[];
