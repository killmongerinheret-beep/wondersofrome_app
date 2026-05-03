const ROME_IMAGES: Record<string, string> = {
  'colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
  'forum': 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&q=80&w=800',
  'trevi': 'https://images.unsplash.com/photo-1512100356956-c1b47cee99bc?auto=format&fit=crop&q=80&w=800',
  'pantheon': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800',
  'vatican-city': 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&q=80&w=800',
  'st-peters-basilica': 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&q=80&w=800',
  'vatican-museums': 'https://images.unsplash.com/photo-1542820239-160910609351?auto=format&fit=crop&q=80&w=800',
  'vatican-pinacoteca': 'https://images.unsplash.com/photo-1615880480595-f5f9b4fb530e?auto=format&fit=crop&q=80&w=800',
  'castel-santangelo': 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&q=80&w=800',
  'trastevere': 'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?auto=format&fit=crop&q=80&w=800',
  'spanish-steps': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&q=80&w=800',
  'piazza-navona': 'https://images.unsplash.com/photo-1542385151-efd9000782a1?auto=format&fit=crop&q=80&w=800',
  'piazza-del-popolo': 'https://images.unsplash.com/photo-1590059343021-99723223f663?auto=format&fit=crop&q=80&w=800',
  'circus-maximus': 'https://images.unsplash.com/photo-1590483734724-34861b0c03da?auto=format&fit=crop&q=80&w=800',
  'baths-caracalla': 'https://images.unsplash.com/photo-1605649406436-193498877e84?auto=format&fit=crop&q=80&w=800',
  'vittoriano': 'https://images.unsplash.com/photo-1590856170881-2292f9765796?auto=format&fit=crop&q=80&w=800',
  'villa-borghese': 'https://images.unsplash.com/photo-1515542706655-18f152d4b81d?auto=format&fit=crop&q=80&w=800',
  'borghese-gallery': 'https://images.unsplash.com/photo-1542820239-160910609351?auto=format&fit=crop&q=80&w=800',
  'appia-antica': 'https://images.unsplash.com/photo-1515542706655-18f152d4b81d?auto=format&fit=crop&q=80&w=800',
  'catacombs-callixtus': 'https://images.unsplash.com/photo-1605649406436-193498877e84?auto=format&fit=crop&q=80&w=800',
  'heart': 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&q=80&w=800',
};

const DEFAULT_ROME = 'https://images.unsplash.com/photo-1515542641795-06722091b58f?auto=format&fit=crop&q=80&w=800';

export const getSightImage = (id: string, currentUrl?: string): string => {
  const key = (id || '').toLowerCase().trim();
  const cleaned = key.replace(/[^a-z0-9]/g, '');

  if (ROME_IMAGES[key]) return ROME_IMAGES[key];
  if (ROME_IMAGES[cleaned]) return ROME_IMAGES[cleaned];

  for (const k in ROME_IMAGES) {
    if (key.includes(k) || k.includes(key)) return ROME_IMAGES[k];
  }

  if (currentUrl && currentUrl.includes('http') && !currentUrl.includes('example.com')) {
    return currentUrl;
  }

  return DEFAULT_ROME;
};
