export type ContentProvider = 'payload' | 'sanity';

export const getContentProvider = (): ContentProvider => {
  const raw = (process.env.EXPO_PUBLIC_CONTENT_PROVIDER ?? '').trim().toLowerCase();
  if (raw === 'payload') return 'payload';
  if (raw === 'sanity') return 'sanity';
  const hasPayload = Boolean((process.env.EXPO_PUBLIC_PAYLOAD_BASE_URL ?? '').trim());
  return hasPayload ? 'payload' : 'sanity';
};

