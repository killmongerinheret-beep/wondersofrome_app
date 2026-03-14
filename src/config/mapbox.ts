export const getMapboxAccessToken = (): string | null => {
  const token =
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
    process.env.MAPBOX_ACCESS_TOKEN ??
    null;

  const trimmed = token?.trim();
  if (!trimmed) return null;
  return trimmed;
};

