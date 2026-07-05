import { EVENT_SLUG_PATTERN } from './event-slug.constant';

/** Guards route params before they reach the CDN: only 'YYYY-MM-DD' shaped slugs are queried. */
export function isValidEventSlug(slug: string): boolean {
  return EVENT_SLUG_PATTERN.test(slug);
}
