export const theme = {
  colors: {
    brand: '#1DB954', // Spotify Green for a "Vibe" or keep Blue if preferred. Let's stick to a vibrant Blue but with Spotify structure.
    brandVibrant: '#007AFF',
    bg: '#121212', // Spotify background
    bgDark: '#000000',
    bgCard: '#181818', // Card background
    bgElevated: '#282828',
    text: '#FFFFFF',
    textMuted: '#B3B3B3',
    textSub: 'rgba(255,255,255,0.7)',
    blurLight: 'rgba(255,255,255,0.1)',
    blurDark: 'rgba(0,0,0,0.45)',
    danger: '#E91E63',
    success: '#1DB954',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  type: {
    h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '700' as const },
    body: { fontSize: 14, fontWeight: '600' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
  },
};
