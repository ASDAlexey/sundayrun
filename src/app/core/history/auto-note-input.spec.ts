import { toAutoNoteInput } from './auto-note-input';
import { AUTO_NOTE_INPUT_CASES, NOTE_INPUT_DATE_ISO } from './auto-note-input.mock';

describe('toAutoNoteInput', () => {
  it('normalizes the athlete key and maps recorded laps to the covered distance', () => {
    for (const [participant, expected] of AUTO_NOTE_INPUT_CASES) {
      expect(toAutoNoteInput(participant, NOTE_INPUT_DATE_ISO)).toEqual(expected);
    }
  });
});
