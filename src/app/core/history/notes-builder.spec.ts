import { applyEventToHistory } from './athletes-rollup';
import { buildAutoNote } from './notes-builder';
import { AUTO_NOTE_CASES, NEXT_EVENT_NOTE_CASES, NOTES_HISTORY, SEASON_OPENER_EVENT, SEASON_OPENER_RESULTS } from './notes-builder.mock';

describe('buildAutoNote', () => {
  it('builds first participation, personal record, year best and empty notes from a prepared history', () => {
    for (const [label, input, expected] of AUTO_NOTE_CASES) {
      expect(buildAutoNote(input, NOTES_HISTORY), label).toBe(expected);
    }
  });

  it('builds notes for the next event after rolling up the previous one', () => {
    const history = applyEventToHistory({}, SEASON_OPENER_EVENT, SEASON_OPENER_RESULTS);

    for (const [label, input, expected] of NEXT_EVENT_NOTE_CASES) {
      expect(buildAutoNote(input, history), label).toBe(expected);
    }
  });
});
