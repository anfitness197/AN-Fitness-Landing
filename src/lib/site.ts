const FALLBACK_SITE_URL = "https://www.anfitness.in";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  if (!path) return getSiteUrl();
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export const PUSH_ICON_PATH = "/assets/logos/web-app-manifest-192x192.png";
export const PUSH_BADGE_PATH = "/assets/logos/favicon-96x96.png";

export function getPushIconUrl() {
  return absoluteUrl(PUSH_ICON_PATH);
}

export function getPushBadgeUrl() {
  return absoluteUrl(PUSH_BADGE_PATH);
}
