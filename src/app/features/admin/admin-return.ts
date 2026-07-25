import { ADMIN_RETURN_FORBIDDEN_PREFIX, ADMIN_RETURN_PREFIX } from './admin-page.constant';

/**
 * Where to go once the key is accepted. Only a single-slash absolute path is followed: `//host` and
 * `https://host` would carry the organiser off the site, and a relative path would resolve against
 * /admin instead of the page that asked for the key.
 */
export function resolveAdminReturnUrl(raw: string | null): string | null {
  if (raw === null || !raw.startsWith(ADMIN_RETURN_PREFIX) || raw.startsWith(ADMIN_RETURN_FORBIDDEN_PREFIX)) {
    return null;
  }

  return raw;
}
