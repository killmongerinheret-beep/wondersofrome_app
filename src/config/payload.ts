export const getPayloadConfig = () => {
  const rawBase =
    process.env.EXPO_PUBLIC_PAYLOAD_BASE_URL ??
    process.env.EXPO_PUBLIC_CMS_BASE_URL ??
    '';

  const baseUrl = rawBase.trim().replace(/\/+$/, '');

  const sightsCollection = (process.env.EXPO_PUBLIC_PAYLOAD_SIGHTS_COLLECTION ?? 'sights').trim();
  const toursCollection = (process.env.EXPO_PUBLIC_PAYLOAD_TOURS_COLLECTION ?? 'tours').trim();
  const audioToursCollection = (process.env.EXPO_PUBLIC_PAYLOAD_AUDIO_TOURS_COLLECTION ?? 'audio-tours').trim();
  const productsCollection = (process.env.EXPO_PUBLIC_PAYLOAD_PRODUCTS_COLLECTION ?? 'products').trim();

  return {
    baseUrl,
    sightsCollection,
    toursCollection,
    audioToursCollection,
    productsCollection,
    isConfigured: Boolean(baseUrl),
  };
};

