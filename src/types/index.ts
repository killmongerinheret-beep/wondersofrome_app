export type AudioVariant = 'quick' | 'deep' | 'kids';

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
  thumbnail: string; // URL or local path
  description: string;
  tips?: string[];
  kidsMyth?: string;
  audioFiles: {
    [key in AudioVariant]?: {
      url: string; // Remote URL for download
      duration: number; // in seconds
      size: number; // in bytes
    };
  };
}

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
