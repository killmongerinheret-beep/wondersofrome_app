## Production readiness checklist

This repo can build store binaries via EAS. This checklist tracks what remains before a real production launch.

### App identity
- Set real bundle/package IDs in [app.json](file:///d:/bot/wondersofrome_app/app.json) (currently `com.youragency.romeaudioguide`).
- Set app display name, slug, and versioning strategy (semantic version + build number).
- Replace icons/splash assets under `assets/` to match final branding.

### Required environment variables
Create `.env` (or brand-specific `.env.wondersofrome` / `.env.ticketsinrome`) based on [.env.example](file:///d:/bot/wondersofrome_app/.env.example).

- Mapbox public token (Explore map)
  - `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
- Mapbox download token (offline map packs)
  - `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
- Payload CMS content backend (sights, tours, products, audio)
  - `EXPO_PUBLIC_CONTENT_PROVIDER=payload`
  - `EXPO_PUBLIC_PAYLOAD_BASE_URL`
  - Optional collection slugs:
    - `EXPO_PUBLIC_PAYLOAD_SIGHTS_COLLECTION`
    - `EXPO_PUBLIC_PAYLOAD_TOURS_COLLECTION`
    - `EXPO_PUBLIC_PAYLOAD_AUDIO_TOURS_COLLECTION`
    - `EXPO_PUBLIC_PAYLOAD_PRODUCTS_COLLECTION`
- Audio CDN (optional, if you want to override Sanity URLs)
  - `EXPO_PUBLIC_AUDIO_CDN_BASE_URL`
- Tickets / checkout backend (if you ship Tickets tab)
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Content completeness
- Ensure audio exists for each sight and each supported language/variant you expose in the UI.
- Ensure `thumbnail`, `description`, and `tips` exist for all sights to avoid empty cards.
- For “walking tours”, ensure each tour has at least 2 stops with valid `lat/lng` and audio URLs.

### Offline experience
- Verify offline audio download + playback for “deep” tracks (storage usage, resume, corruption).
- Verify offline map download/delete on both iOS and Android.
- Add user-facing “storage usage” messaging and a safe “clear downloads” flow (already present in Offline Pack).

### Permissions + background behavior
- Confirm location prompts and background permissions are justified and match store policies.
- Confirm background audio works reliably on iOS and Android and is compliant with store guidelines.
- Confirm geofencing behavior does not drain battery excessively and can be disabled (recommended: add a toggle in settings).

### Reliability + error handling
- Add loading skeletons and empty states across screens (Home now has skeletons; extend to Explore/Tickets/Shop).
- Add defensive UI for missing tokens (Explore already blocks without Mapbox token).
- Add retry UI for failed network calls (Sanity, Supabase).

### Privacy + legal
- Add Privacy Policy + Terms URLs (required for app stores, especially with location + background audio).
- In-app About screen exists; configure links via:
  - `EXPO_PUBLIC_BRAND_DOMAIN`
  - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
  - `EXPO_PUBLIC_TERMS_URL`
  - `EXPO_PUBLIC_SUPPORT_URL`

### Monitoring
- Add crash reporting (e.g. Sentry) and optional analytics.
- Add a minimal logging policy (avoid logging secrets).

### Release process
- Use [BUILDING.md](file:///d:/bot/wondersofrome_app/BUILDING.md) for EAS builds.
- Create `eas.json` production profiles with correct store IDs and env vars.
- Configure signing (iOS provisioning, Android keystore) in EAS.
- Prepare store listings (screenshots, preview video, description, keywords).
