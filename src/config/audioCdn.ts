export const getAudioCdnBaseUrl = (): string | null => {
  const raw =
    process.env.EXPO_PUBLIC_AUDIO_CDN_BASE_URL ??
    process.env.EXPO_PUBLIC_CDN_BASE_URL ??
    '';

  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  return trimmed;
};

