export type SiteId = 'ticketsinrome' | 'wondersofrome';

export const getSiteId = (): SiteId => {
  const raw =
    process.env.EXPO_PUBLIC_SITE_ID ??
    process.env.SITE_ID ??
    'ticketsinrome';

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'wondersofrome') return 'wondersofrome';
  return 'ticketsinrome';
};

