export const getSupabaseConfig = () => {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    '';
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    '';

  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();

  return {
    url: trimmedUrl,
    anonKey: trimmedKey,
    isConfigured: Boolean(trimmedUrl && trimmedKey),
  };
};

