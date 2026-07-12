import { applyEventToHistory } from './athletes-rollup';
import { buildEventAutoNotes } from './event-auto-notes';
import {
  NEXT_EVENT_DATE_ISO,
  NEXT_EVENT_EXPECTED_NOTES,
  NEXT_EVENT_INPUTS,
  OPENER_EXPECTED_NOTES,
  OPENER_INPUTS,
  SEASON_OPENER_EVENT,
  SEASON_OPENER_RESULTS,
} from './event-auto-notes.mock';

describe('buildEventAutoNotes', () => {
  it('gives the year-best note per gender to the fastest improver only, folding results in time order', () => {
    const history = applyEventToHistory({}, SEASON_OPENER_EVENT, SEASON_OPENER_RESULTS);

    expect(buildEventAutoNotes(NEXT_EVENT_INPUTS, history, NEXT_EVENT_DATE_ISO)).toEqual(NEXT_EVENT_EXPECTED_NOTES);
  });

  it('marks everyone as a first participation against an empty history without year-best notes', () => {
    expect(buildEventAutoNotes(OPENER_INPUTS, {}, SEASON_OPENER_EVENT.dateIso)).toEqual(OPENER_EXPECTED_NOTES);
  });
});
