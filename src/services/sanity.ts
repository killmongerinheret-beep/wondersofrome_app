import { getAudioCdnBaseUrl } from '../config/audioCdn';
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION } from '../config/sanity';
import { Sight, AudioVariant, AudioLang, LangAudioFiles } from '../types';

const BASE = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

const LANGS: AudioLang[] = ['en', 'it', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'pl', 'ru', 'ar', 'ko'];

// Build GROQ projection for all language audio blocks
// Each lang has audioQuick/audioDeep/audioKids sub-objects in Sanity
const audioLangProjection = LANGS.map(
  (lang) =>
    `"${lang}": audio_${lang}{ "quick": audioQuick{url,duration,size}, "deep": audioDeep{url,duration,size}, "kids": audioKids{url,duration,size} }`
).join(',\n    ');

const SIGHTS_QUERY = encodeURIComponent(`*[_type == "sight" && defined(lat) && defined(lng)]{
  "id": slug.current,
  name,
  name_it,
  category,
  pack,
  lat,
  lng,
  radius,
  description,
  "thumbnail": thumbnail.asset->url + "?w=800&auto=format",
  tips,
  kidsMyth,
  transcripts,
  "audioFiles": {
    ${audioLangProjection}
  },
  "linkedTour": linkedTour->{
    "slug": slug.current,
    title,
    price,
    "site": sites[0]->{ domain }
  }
}`);

export type LinkedTour = {
  slug: string;
  title: string;
  price?: number;
  site?: { domain: string };
};

export type SanitySight = {
  id: string;
  name: string;
  name_it?: string;
  category?: string;
  pack?: 'essential' | 'full';
  lat: number;
  lng: number;
  radius?: number;
  description?: string;
  thumbnail?: string;
  tips?: string[];
  kidsMyth?: string;
  transcripts?: any;
  audioFiles?: LangAudioFiles;
  linkedTour?: LinkedTour;
};

const mapCategory = (cat?: string): Sight['category'] => {
  const map: Record<string, Sight['category']> = {
    ancient: 'ancient',
    religious: 'religious',
    museum: 'museum',
    piazza: 'piazza',
  };
  return map[cat ?? ''] ?? 'other';
};

export const fetchSightsFromSanity = async (): Promise<Sight[]> => {
  const res = await fetch(`${BASE}?query=${SIGHTS_QUERY}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Sanity fetch failed: ${res.status}`);
  const json = await res.json();
  const rows: SanitySight[] = json.result ?? [];
  const audioCdnBase = getAudioCdnBaseUrl();

  return rows
    .filter((r) => r.id && r.lat && r.lng)
    .map((r): Sight => {
      const audioFiles: LangAudioFiles = r.audioFiles ?? {};

      if (audioCdnBase) {
        const langs: AudioLang[] = [
          'en',
          'it',
          'es',
          'fr',
          'de',
          'zh',
          'ja',
          'pt',
          'pl',
          'ru',
          'ar',
          'ko',
        ];
        const variants: AudioVariant[] = ['quick', 'deep', 'kids'];

        // Map app IDs to specific R2 folder names (Only for exact matches)
        const r2FolderMap: Record<string, string> = {
          'vatican-museums': 'vatican-museums',
          'st-peters-basilica': 'st-peters-basilica',
          'sistine-chapel': 'sistine-chapel',
          'vatican-pinacoteca': 'vatican-pinacoteca',
          'jewish-ghetto': 'jewish-ghetto',
          'ostia-antica': 'ostia-antica',
        };

        // Folders that actually exist in your R2 bucket
        const existingR2Folders = new Set([
          'colosseum',
          'forum',
          'heart',
          'jewish-ghetto',
          'ostia-antica',
          'pantheon',
          'sistine-chapel',
          'st-peters-basilica',
          'trastevere',
          'vatican-museums',
          'vatican-pinacoteca',
        ]);

        for (const lang of langs) {
          for (const variant of variants) {
            const existing = audioFiles?.[lang]?.[variant]?.url?.trim() ?? '';
            if (!existing || existing.includes('example.com')) {
              const folderName = r2FolderMap[r.id] ?? r.id;
              
              // Only inject if the folder exists in R2
              if (existingR2Folders.has(folderName)) {
                const fileToUse = (variant === 'quick' || variant === 'deep') ? 'deep' : variant;
                const url = `${audioCdnBase}/${lang}/${folderName}/${fileToUse}.mp3`;
                audioFiles[lang] = audioFiles[lang] ?? {};
                audioFiles[lang]![variant] = {
                  url,
                  duration: audioFiles[lang]?.[variant]?.duration ?? 0,
                  size: audioFiles[lang]?.[variant]?.size ?? 0,
                };
              }
            }
          }
        }
      }

      return {
        id: r.id,
        name: r.name,
        name_it: r.name_it,
        lat: r.lat,
        lng: r.lng,
        radius: r.radius ?? 20,
        category: mapCategory(r.category),
        has_tips: !!(r.tips?.length || r.kidsMyth),
        pack: r.pack ?? 'full',
        thumbnail: r.thumbnail ?? '',
        description: r.description ?? '',
        tips: r.tips,
        kidsMyth: r.kidsMyth,
        audioFiles,
        transcripts: r.transcripts ?? undefined,
        linkedTour: r.linkedTour,
      };
    });
};

// ── Tours (all, for the Shop/Tours tab) ──────────────────────────────────────

const TOURS_QUERY = encodeURIComponent(`*[_type == "tour"] | order(_createdAt desc) {
  "id": slug.current,
  title,
  "slug": slug.current,
  price,
  duration,
  category,
  tourType,
  badge,
  rating,
  reviewCount,
  groupSize,
  "thumbnail": mainImage.asset->url + "?w=600&auto=format",
  highlights[0..2],
  "site": sites[0]->{ domain, "id": slug.current }
}`);

export type SanityTour = {
  id: string;
  title: string;
  slug: string;
  price?: number;
  duration?: string;
  category?: string;
  tourType?: string;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  groupSize?: string;
  thumbnail?: string;
  highlights?: string[];
  site?: { domain: string; id: string };
};

export const fetchToursFromSanity = async (): Promise<SanityTour[]> => {
  const res = await fetch(`${BASE}?query=${TOURS_QUERY}`);
  if (!res.ok) throw new Error(`Sanity tours fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.result ?? []).filter((t: SanityTour) => t.id);
};

// ── Audio Tours / Routes (ordered stops for in-app playback) ───────────────────

const AUDIO_TOURS_QUERY = encodeURIComponent(`*[
  (_type == "audioTour") ||
  (_type == "tour" && defined(stops))
] | order(_createdAt desc) {
  "id": slug.current,
  title,
  description,
  duration,
  "thumbnail": coalesce(mainImage.asset->url, thumbnail.asset->url) + "?w=800&auto=format",
  "stops": coalesce(stops, sights, route, itinerary)[]->{
    "id": slug.current,
    name,
    name_it,
    category,
    pack,
    lat,
    lng,
    radius,
    description,
    "thumbnail": thumbnail.asset->url + "?w=800&auto=format",
    tips,
    kidsMyth,
    "audioFiles": {
      ${audioLangProjection}
    }
  }
}`);

export type SanityAudioTour = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
  stops?: SanitySight[];
};

export const fetchAudioToursFromSanity = async (): Promise<SanityAudioTour[]> => {
  const res = await fetch(`${BASE}?query=${AUDIO_TOURS_QUERY}`);
  if (!res.ok) throw new Error(`Sanity audio tours fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.result ?? []).filter((t: SanityAudioTour) => t.id);
};

// ── Products (souvenirs / shop) ───────────────────────────────────────────────

const PRODUCTS_QUERY =
  encodeURIComponent(`*[_type == "product" && inStock == true] | order(_createdAt desc) {
  "id": slug.current,
  name,
  description,
  price,
  category,
  inStock,
  stockCount,
  weight,
  "images": images[].asset->url + "?w=600&auto=format",
  variants[]{ id, label, price, inStock }
}`);

export type SanityProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  inStock: boolean;
  stockCount?: number;
  weight?: number;
  images?: string[];
  variants?: { id: string; label: string; price?: number; inStock: boolean }[];
};

export const fetchProductsFromSanity = async (): Promise<SanityProduct[]> => {
  const res = await fetch(`${BASE}?query=${PRODUCTS_QUERY}`);
  if (!res.ok) throw new Error(`Sanity products fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.result ?? []).filter((p: SanityProduct) => p.id && p.price != null);
};
