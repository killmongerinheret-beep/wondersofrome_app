const SITE_ID = (process.env.EXPO_PUBLIC_SITE_ID || 'wondersofrome').trim();

const bySite = {
  wondersofrome: {
    name: 'Wonders of Rome',
    slug: 'wonders-of-rome',
    iosBundleId: 'com.wondersofrome.romeaudioguide',
    androidPackage: 'com.wondersofrome.romeaudioguide',
  },
  ticketsinrome: {
    name: 'Tickets in Rome',
    slug: 'tickets-in-rome',
    iosBundleId: 'com.ticketsinrome.romeaudioguide',
    androidPackage: 'com.ticketsinrome.romeaudioguide',
  },
};

const brand = bySite[SITE_ID] || bySite.wondersofrome;

module.exports = ({ config }) => ({
  ...config,
  name: brand.name,
  slug: brand.slug,
  ios: {
    ...(config.ios || {}),
    bundleIdentifier: brand.iosBundleId,
  },
  android: {
    ...(config.android || {}),
    package: brand.androidPackage,
  },
  extra: {
    ...(config.extra || {}),
    EXPO_PUBLIC_SITE_ID: SITE_ID,
  },
});

