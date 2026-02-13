export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  schoolId?: string;
  school?: School;
  board: Board;
  isVerified: boolean;
  children: Child[];
  createdAt: string;
}

export interface Child {
  id: string;
  userId: string;
  name?: string;
  gender?: string;
  currentClass: number;
  schoolId?: string;
  school?: School;
}

export interface School {
  id: string;
  name: string;
  city: string;
  board: Board;
  address?: string;
  isVerified: boolean;
}

export interface Listing {
  id: string;
  userId: string;
  user: { id: string; name: string; city: string };
  listingType: 'SET' | 'INDIVIDUAL';
  board: Board;
  class: number;
  schoolId?: string;
  school?: School;
  city: string;
  yearOfPurchase?: number;
  condition: BookCondition;
  exchangePreference: ExchangePreference[];
  status: 'ACTIVE' | 'RESERVED' | 'EXCHANGED' | 'CANCELLED';
  items: ListingItem[];
  images: ListingImage[];
  createdAt: string;
}

export interface ListingItem {
  id: string;
  subject: string;
  title?: string;
  publisher?: string;
  condition?: BookCondition;
}

export interface ListingImage {
  id: string;
  imageUrl: string;
  imageType?: string;
}

export interface BookRequest {
  id: string;
  userId: string;
  board: Board;
  class: number;
  subjects: string[];
  schoolId?: string;
  school?: School;
  city: string;
  minCondition?: BookCondition;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  isFloated: boolean;
  matches: Match[];
  createdAt: string;
}

export interface Match {
  id: string;
  listingId: string;
  listing: Listing;
  requestId: string;
  request: BookRequest;
  giverId: string;
  giver: { id: string; name: string; city: string; phone: string };
  receiverId: string;
  receiver: { id: string; name: string; city: string; phone: string };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  exchangeMethod?: ExchangePreference;
  exchangeDate?: string;
  exchangeLocation?: string;
  createdAt: string;
}

export type Board = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'IGCSE';
export type BookCondition = 'UNUSED' | 'ALMOST_NEW' | 'WATER_MARKS' | 'UNDERLINED';
export type ExchangePreference = 'PICKUP' | 'SCHOOL' | 'PORTER';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
