import { noteBadgeKindOf } from './note-badge-kind';
import { NOTE_BADGE_KIND_CASES } from './note-badge-kind.mock';

describe('note-badge-kind', () => {
  it('classifies auto-note, kids and status tokens; anything else stays plain', () => {
    for (const [token, expected] of NOTE_BADGE_KIND_CASES) {
      expect(noteBadgeKindOf(token), `noteBadgeKindOf(${JSON.stringify(token)})`).toBe(expected);
    }
  });
});
