import { prNoteTimeWithDate, prNoteWithDate, splitPrNote } from './pr-note';
import {
  EXPECTED_COMBINED_PARTS,
  EXPECTED_DATED_COMBINED_NOTE,
  EXPECTED_DATED_PLAIN_NOTE,
  EXPECTED_PLAIN_PARTS,
  EXPECTED_TIME_WITH_DATE,
  PR_NOTE_COMBINED,
  PR_NOTE_PLAIN,
  PR_NOTE_PREVIOUS_BEST,
  PR_NOTE_WITHOUT_RECORD,
} from './pr-note.mock';

describe('pr-note', () => {
  it('splits the record token out of a note and dates it against the previous best run', () => {
    expect(splitPrNote(PR_NOTE_PLAIN)).toEqual(EXPECTED_PLAIN_PARTS);
    expect(splitPrNote(PR_NOTE_COMBINED), 'organiser text and the year token survive around the record').toEqual(EXPECTED_COMBINED_PARTS);
    expect(splitPrNote(PR_NOTE_WITHOUT_RECORD), 'a note without the record token never splits').toBeNull();
    expect(prNoteTimeWithDate(EXPECTED_PLAIN_PARTS.time, PR_NOTE_PREVIOUS_BEST)).toBe(EXPECTED_TIME_WITH_DATE);
    expect(prNoteWithDate(PR_NOTE_PLAIN, PR_NOTE_PREVIOUS_BEST)).toBe(EXPECTED_DATED_PLAIN_NOTE);
    expect(prNoteWithDate(PR_NOTE_COMBINED, PR_NOTE_PREVIOUS_BEST)).toBe(EXPECTED_DATED_COMBINED_NOTE);
    expect(prNoteWithDate(PR_NOTE_PLAIN, undefined), 'without a known previous run the note stays as stored').toBe(PR_NOTE_PLAIN);
    expect(prNoteWithDate(PR_NOTE_WITHOUT_RECORD, PR_NOTE_PREVIOUS_BEST), 'a recordless note stays as stored').toBe(PR_NOTE_WITHOUT_RECORD);
  });
});
