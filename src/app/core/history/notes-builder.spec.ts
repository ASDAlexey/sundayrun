import { buildAutoNote } from './notes-builder';
import { AUTO_NOTE_CASES, NOTES_HISTORY } from './notes-builder.mock';

describe('buildAutoNote', () => {
  it('builds first participation, personal record, year best and combined notes from a prepared history', () => {
    for (const [label, input, courseYearBestMs, expected] of AUTO_NOTE_CASES) {
      expect(buildAutoNote(input, NOTES_HISTORY, courseYearBestMs), label).toBe(expected);
    }
  });
});
