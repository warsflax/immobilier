export type ListingType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'studio' | 'office';
export type ListingStatus = 'available' | 'sold' | 'rented';

export interface Listing {
  id: string;
  title: string;
  description: string;
  translations?: {
    fr?: { title: string; description: string };
    ar?: { title: string; description: string };
    en?: { title: string; description: string };
    de?: { title: string; description: string };
    es?: { title: string; description: string };
  };
  type: ListingType;
  propertyType: PropertyType;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  amenities: string[];
  whatsappNumber: string;
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string;
  status: ListingStatus;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin';
  isActive: boolean;
}

export interface Agency {
  id: string;
  name: string;
  slug: string; // URL-friendly name for the agency vitrine
  isActive: boolean;
  ownerEmail: string;
  createdAt: string;
  logo?: string;
  description?: string;
}

export interface AppSettings {
  appName: string;
  appLogo?: string;
  primaryColor: string;
  heroImage: string;
  currency: string;
  heroTitle: string;
  heroSubtitle: string;
  listingsTitle: string;
  translations?: {
    ar?: { heroTitle: string; heroSubtitle: string; listingsTitle: string };
    en?: { heroTitle: string; heroSubtitle: string; listingsTitle: string };
    de?: { heroTitle: string; heroSubtitle: string; listingsTitle: string };
    es?: { heroTitle: string; heroSubtitle: string; listingsTitle: string };
  };
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
