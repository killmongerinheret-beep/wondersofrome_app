import { getPayloadConfig } from '../config/payload';
import { getAudioCdnBaseUrl } from '../config/audioCdn';
import { AudioLang, AudioVariant, LangAudioFiles, Product, Sight } from '../types';

const LANGS: AudioLang[] = ['en', 'it', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'pl', 'ru', 'ar', 'ko'];
const VARIANTS: AudioVariant[] = ['quick', 'deep', 'kids'];

const mapCategory = (cat?: string): Sight['category'] => {
  const map: Record<string, Sight['category']> = {
    ancient: 'ancient',
    religious: 'religious',
    museum: 'museum',
    piazza: 'piazza',
    other: 'other',
  };
  return map[String(cat ?? '').toLowerCase()] ?? 'other';
};

const asSlug = (v: any): string => {
  const s = (typeof v === 'string' ? v : v?.current ?? v?.slug ?? '').toString().trim();
  return s;
};

const asUrl = (v: any): string => {
  const s = (typeof v === 'string' ? v : v?.url ?? '').toString().trim();
  return s;
};

const joinUrl = (base: string, path: string) => `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

const fetchPayload = async (path: string) => {
  const cfg = getPayloadConfig();
  if (!cfg.isConfigured) throw new Error('Payload is not configured. Set EXPO_PUBLIC_PAYLOAD_BASE_URL.');
  const url = joinUrl(cfg.baseUrl, path);
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Payload fetch failed: ${res.status}`);
  return res.json();
};

const withAudioCdnFallback = (sightId: string, audioFiles: LangAudioFiles): LangAudioFiles => {
  const audioCdnBase = getAudioCdnBaseUrl();
  if (!audioCdnBase) return audioFiles;
  for (const lang of LANGS) {
    for (const variant of VARIANTS) {
      const existing = audioFiles?.[lang]?.[variant]?.url?.trim() ?? '';
      if (existing && !existing.includes('example.com')) continue;
      const url = `${audioCdnBase}/audio/${lang}/${sightId}/${variant}.m4a`;
      audioFiles[lang] = audioFiles[lang] ?? {};
      audioFiles[lang]![variant] = {
        url,
        duration: audioFiles[lang]?.[variant]?.duration ?? 0,
        size: audioFiles[lang]?.[variant]?.size ?? 0,
      };
    }
  }
  return audioFiles;
};

const mapSightDoc = (doc: any): Sight | null => {
  const id = asSlug(doc?.slug ?? doc?.id ?? doc?._id);
  const lat = Number(doc?.lat ?? doc?.latitude);
  const lng = Number(doc?.lng ?? doc?.longitude);
  if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const audioFiles: LangAudioFiles = (doc?.audioFiles ?? doc?.audio_files ?? {}) as any;
  const thumb = asUrl(doc?.thumbnail ?? doc?.image ?? doc?.mainImage ?? doc?.main_image);
  const description = (doc?.description ?? doc?.desc ?? '').toString();

  return {
    id,
    name: (doc?.name ?? doc?.title ?? id).toString(),
    name_it: (doc?.name_it ?? '').toString() || undefined,
    lat,
    lng,
    radius: Number.isFinite(Number(doc?.radius)) ? Number(doc.radius) : 70,
    category: mapCategory(doc?.category),
    has_tips: Array.isArray(doc?.tips) && doc.tips.length > 0,
    pack: (doc?.pack === 'essential' || doc?.pack === 'full') ? doc.pack : undefined,
    thumbnail: thumb || '',
    description: description || '',
    tips: Array.isArray(doc?.tips) ? doc.tips.map((t: any) => String(t)) : undefined,
    kidsMyth: (doc?.kidsMyth ?? doc?.kids_myth ?? '').toString() || undefined,
    audioFiles: withAudioCdnFallback(id, audioFiles),
  };
};

export type AudioTour = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
  stops?: Sight[];
};

export const fetchSightsFromPayload = async (): Promise<Sight[]> => {
  const cfg = getPayloadConfig();
  const json = await fetchPayload(`/api/${cfg.sightsCollection}?limit=250&depth=2`);
  const docs: any[] = Array.isArray(json?.docs) ? json.docs : Array.isArray(json?.result) ? json.result : [];
  return docs.map(mapSightDoc).filter(Boolean) as Sight[];
};

export const fetchAudioToursFromPayload = async (): Promise<AudioTour[]> => {
  const cfg = getPayloadConfig();
  const json = await fetchPayload(`/api/${cfg.audioToursCollection}?limit=200&depth=4`);
  const docs: any[] = Array.isArray(json?.docs) ? json.docs : [];
  return docs
    .map((d) => {
      const id = asSlug(d?.slug ?? d?.id ?? d?._id);
      if (!id) return null;
      const stopsRaw = (d?.stops ?? d?.sights ?? d?.route ?? d?.itinerary ?? []) as any[];
      const stops = (Array.isArray(stopsRaw) ? stopsRaw : []).map(mapSightDoc).filter(Boolean) as Sight[];
      return {
        id,
        title: (d?.title ?? d?.name ?? id).toString(),
        description: (d?.description ?? '').toString() || undefined,
        duration: (d?.duration ?? '').toString() || undefined,
        thumbnail: asUrl(d?.thumbnail ?? d?.mainImage) || undefined,
        stops,
      } as AudioTour;
    })
    .filter(Boolean) as AudioTour[];
};

export const fetchProductsFromPayload = async (): Promise<Product[]> => {
  const cfg = getPayloadConfig();
  const json = await fetchPayload(`/api/${cfg.productsCollection}?limit=200&depth=2`);
  const docs: any[] = Array.isArray(json?.docs) ? json.docs : [];
  return docs
    .map((d) => {
      const id = asSlug(d?.slug ?? d?.id ?? d?._id);
      const price = Number(d?.price);
      if (!id || !Number.isFinite(price)) return null;
      const images = Array.isArray(d?.images) ? d.images.map(asUrl).filter(Boolean) : [];
      return {
        id,
        name: (d?.name ?? d?.title ?? id).toString(),
        description: (d?.description ?? '').toString(),
        price,
        images,
        category: (d?.category as any) ?? 'other',
        inStock: Boolean(d?.inStock ?? d?.in_stock ?? true),
        stockCount: d?.stockCount ? Number(d.stockCount) : undefined,
        weight: d?.weight ? Number(d.weight) : undefined,
        variants: Array.isArray(d?.variants)
          ? d.variants.map((v: any) => ({ id: String(v?.id ?? v?._id ?? ''), label: String(v?.label ?? ''), price: v?.price != null ? Number(v.price) : undefined, inStock: Boolean(v?.inStock ?? true) }))
          : undefined,
      } as Product;
    })
    .filter(Boolean) as Product[];
};
