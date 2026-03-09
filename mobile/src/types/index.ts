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
  title: string;
  description?: string;
  category: Category;
  board?: Board;
  class?: number;
  subject?: string;
  schoolId?: string;
  school?: School;
  city: string;
  buyingPrice?: number;
  sellingPrice: number;
  condition: BookCondition;
  yearOfPurchase?: number;
  status: 'PENDING' | 'ACTIVE' | 'SOLD' | 'CANCELLED';
  images: ListingImage[];
  createdAt: string;
}

export interface ListingImage {
  id: string;
  imageUrl: string;
  imageType?: string;
}

export interface Deal {
  id: string;
  listingId: string;
  listing: Listing;
  buyerId: string;
  buyer: { id: string; name: string; city: string; phone: string };
  sellerId: string;
  seller: { id: string; name: string; city: string; phone: string };
  offeredPrice?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

// Keep old types for backward compat
export type Match = Deal;

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
  matches: Deal[];
  createdAt: string;
}

export type Board = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'IGCSE';
export type Category = 'BOOK' | 'STATIONERY';
export type BookCondition = 'HARDLY_USED' | 'WELL_MAINTAINED' | 'MARKER_USED' | 'STAINS' | 'TORN_PAGES';
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
