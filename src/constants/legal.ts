import { getSiteId } from './site';

const normalize = (u: string) => u.trim().replace(/\/+$/, '');

export const getBrandDomain = () => {
  const site = getSiteId();
  const raw = (process.env.EXPO_PUBLIC_BRAND_DOMAIN ?? '').trim();
  if (raw) return normalize(raw);
  if (site === 'wondersofrome') return 'https://wondersofrome.com';
  return 'https://ticketsinrome.com';
};

export const getLegalLinks = () => {
  const domain = getBrandDomain();
  const privacy = (process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? `${domain}/privacy-policy`).trim();
  const terms = (process.env.EXPO_PUBLIC_TERMS_URL ?? `${domain}/terms`).trim();
  const support = (process.env.EXPO_PUBLIC_SUPPORT_URL ?? `${domain}/support`).trim();
  return {
    domain,
    privacy,
    terms,
    support,
  };
};

