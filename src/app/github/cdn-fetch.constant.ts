/**
 * jsDelivr serves branch urls with `max-age=604800`, so a plain fetch would keep returning
 * the browser-cached file for up to a week after a publication. `no-cache` forces a
 * conditional revalidation against the CDN (a cheap 304 when nothing changed).
 */
export const CDN_REVALIDATE_FETCH_OPTIONS: RequestInit = { cache: 'no-cache' };
