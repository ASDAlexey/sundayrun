import { mergeAutoNote } from './note-merge';
import { MERGE_AUTO_NOTE_CASES } from './note-merge.mock';

describe('mergeAutoNote', () => {
  it('replaces stale auto tokens and keeps organiser-written text', () => {
    for (const [label, autoNote, storedNote, expected] of MERGE_AUTO_NOTE_CASES) {
      expect(mergeAutoNote(autoNote, storedNote), label).toBe(expected);
    }
  });
});
