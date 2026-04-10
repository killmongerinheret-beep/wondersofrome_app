import { getContentProvider } from '../config/content';
import { Product, Sight } from '../types';
import { AudioTour, fetchAudioToursFromPayload, fetchProductsFromPayload, fetchSightsFromPayload } from './payload';
import { fetchAudioToursFromSanity, fetchProductsFromSanity, fetchSightsFromSanity, SanityAudioTour } from './sanity';

export type { AudioTour };

const toSightSafe = (s: any): Sight | null => {
  const id = String(s?.id ?? '').trim();
  const lat = Number(s?.lat);
  const lng = Number(s?.lng);
  if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const radius = Number.isFinite(Number(s?.radius)) ? Number(s.radius) : 70;
  const thumbnail = String(s?.thumbnail ?? '').trim();
  const description = String(s?.description ?? '').trim();
  const tips = Array.isArray(s?.tips) ? s.tips.map((t: any) => String(t)) : undefined;
  return {
    id,
    name: String(s?.name ?? id),
    name_it: s?.name_it ? String(s.name_it) : undefined,
    lat,
    lng,
    radius,
    category: (s?.category as any) ?? 'other',
    has_tips: Boolean(tips && tips.length),
    pack: s?.pack === 'essential' || s?.pack === 'full' ? s.pack : undefined,
    thumbnail,
    description,
    tips,
    kidsMyth: s?.kidsMyth ? String(s.kidsMyth) : undefined,
    audioFiles: (s?.audioFiles ?? {}) as any,
    transcripts: s?.transcripts ?? s?.transcripts ?? undefined,
    linkedTour: s?.linkedTour ?? undefined,
  };
};

export const fetchSights = async (): Promise<Sight[]> => {
  const provider = getContentProvider();
  if (provider === 'payload') {
    try {
      const out = await fetchSightsFromPayload();
      if (out.length) return out;
    } catch {}
  }
  return fetchSightsFromSanity();
};

export const fetchAudioTours = async (): Promise<AudioTour[]> => {
  const provider = getContentProvider();
  if (provider === 'payload') {
    try {
      const out = await fetchAudioToursFromPayload();
      if (out.length) return out;
    } catch {}
  }
  const sanity = await fetchAudioToursFromSanity();
  return sanity
    .map((t: SanityAudioTour) => {
      const stops = (t.stops ?? []).map(toSightSafe).filter(Boolean) as Sight[];
      return { id: t.id, title: t.title, description: t.description, duration: t.duration, thumbnail: t.thumbnail, stops };
    })
    .filter((t) => !!t.id);
};

export const fetchProducts = async (): Promise<Product[]> => {
  const provider = getContentProvider();
  if (provider === 'payload') {
    try {
      const out = await fetchProductsFromPayload();
      if (out.length) return out;
    } catch {}
  }
  const sanity = await fetchProductsFromSanity();
  return sanity.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    images: p.images ?? [],
    category: (p.category as any) ?? 'other',
    inStock: p.inStock,
    stockCount: p.stockCount,
    weight: p.weight,
    variants: p.variants,
  }));
};
