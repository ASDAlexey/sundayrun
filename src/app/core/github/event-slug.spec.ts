import { isValidEventSlug } from './event-slug';
import { INVALID_EVENT_SLUGS, VALID_EVENT_SLUGS } from './event-slug.mock';

describe('isValidEventSlug', () => {
  it('accepts only YYYY-MM-DD shaped slugs', () => {
    for (const slug of VALID_EVENT_SLUGS) {
      expect(isValidEventSlug(slug), `valid slug: ${slug}`).toBe(true);
    }

    for (const slug of INVALID_EVENT_SLUGS) {
      expect(isValidEventSlug(slug), `invalid slug: ${JSON.stringify(slug)}`).toBe(false);
    }
  });
});
