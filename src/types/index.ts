export type AudioVariant = 'quick' | 'deep' | 'kids';

export type AudioLang =
  | 'en' | 'it' | 'es' | 'fr' | 'de'
  | 'zh' | 'ja' | 'pt' | 'pl' | 'ru' | 'ar' | 'ko';

export interface AudioTrack {
  url: string;       // Remote URL for download
  duration: number;  // seconds
  size: number;      // bytes
}

export type LangAudioFiles = {
  [lang in AudioLang]?: {
    [variant in AudioVariant]?: AudioTrack;
  };
};

export interface Sight {
  id: string;
  name: string;
  name_it?: string;
  lat: number;
  lng: number;
  radius: number;
  category: 'ancient' | 'religious' | 'museum' | 'piazza' | 'other';
  has_tips: boolean;
  pack?: 'essential' | 'full';
  thumbnail: string;
  description: string;
  tips?: string[];
  kidsMyth?: string;
  /** Multilingual audio: audioFiles[lang][variant] */
  audioFiles: LangAudioFiles;
  /** Multilingual transcripts: transcripts[lang][variant] */
  transcripts?: {
    [lang in AudioLang]?: {
      [variant in AudioVariant]?: string;
    };
  };
  linkedTour?: {
    slug: string;
    title: string;
    price?: number;
    site?: { domain: string };
  };
}

// ── Shop / Ecommerce ──────────────────────────────────────────────────────────

export type ProductCategory = 'souvenir' | 'book' | 'food' | 'apparel' | 'other';

export interface Product {
  id: string;           // Sanity slug
  name: string;
  description: string;
  price: number;        // EUR
  images: string[];     // CDN URLs
  category: ProductCategory;
  inStock: boolean;
  stockCount?: number;
  weight?: number;      // grams, for shipping calc
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  label: string;        // e.g. "S", "M", "Red"
  price?: number;       // override if different from base
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  variantId?: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled';

export interface Order {
  id: string;
  items: CartItem[];
  address: ShippingAddress;
  total: number;
  status: OrderStatus;
  createdAt: string;
  stripePaymentIntentId?: string;
}

// ── Geofence ──────────────────────────────────────────────────────────────────

export interface GeofenceConfig {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}

export type DownloadState = 'idle' | 'downloading' | 'completed' | 'error';
