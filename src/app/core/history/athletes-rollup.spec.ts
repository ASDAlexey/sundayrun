import { applyEventToHistory, historyBeforeDate, removeEventFromHistory } from './athletes-rollup';
import {
  BEFORE_DATE_HISTORY,
  CORRECTED_DNF_RESULTS,
  CUTOFF_DATE_ISO,
  CUTOFF_ONLY_KEY,
  DNF_EVENT,
  DNF_ONLY_KEY,
  DNF_REPUBLISH_EVENT,
  EXPECTED_BEFORE_DATE_HISTORY,
  EXPECTED_MIXED_RECORD,
  EXPECTED_REMOVAL_HISTORY,
  EXPECTED_ROLLUP_HISTORY,
  MISSING_SLUG,
  MISSPELLED_DNF_KEY,
  MISSPELLED_DNF_RESULTS,
  MIXED_ATHLETE_KEY,
  MIXED_DATES_KEY,
  MIXED_DNF_RESULTS,
  MIXED_RUN_RESULTS,
  OLDER_ONLY_KEY,
  REMOVAL_HISTORY,
  REMOVED_SLUG,
  REPEAT_RUNNER_KEY,
  ROLLUP_EVENTS,
  RUN_EVENT,
  SINGLE_RUN_KEY,
} from './athletes-rollup.mock';

describe('applyEventToHistory', () => {
  it('rolls three sequential events into a new history without mutating the input', () => {
    const [[firstEvent, firstResults], [secondEvent, secondResults], [thirdEvent, thirdResults]] = ROLLUP_EVENTS;
    const afterFirst = applyEventToHistory({}, firstEvent, firstResults);
    const snapshotOfFirst = structuredClone(afterFirst);
    const afterSecond = applyEventToHistory(afterFirst, secondEvent, secondResults);
    const afterThird = applyEventToHistory(afterSecond, thirdEvent, thirdResults);

    expect(afterThird).toEqual(EXPECTED_ROLLUP_HISTORY);
    expect(afterFirst, 'input history must stay untouched').toEqual(snapshotOfFirst);
    expect(afterSecond[REPEAT_RUNNER_KEY], 'touched records are copied').not.toBe(afterFirst[REPEAT_RUNNER_KEY]);
    expect(afterSecond[REPEAT_RUNNER_KEY].runs, 'touched runs arrays are copied').not.toBe(afterFirst[REPEAT_RUNNER_KEY].runs);
    expect(afterSecond[DNF_ONLY_KEY], 'untouched records are shared').toBe(afterFirst[DNF_ONLY_KEY]);
  });
});

describe('removeEventFromHistory', () => {
  it('removes runs by slug with bests recompute, drops emptied athletes and keeps an unknown slug a no-op', () => {
    const snapshot = structuredClone(REMOVAL_HISTORY);
    const afterRemoval = removeEventFromHistory(REMOVAL_HISTORY, REMOVED_SLUG);
    const afterMissing = removeEventFromHistory(REMOVAL_HISTORY, MISSING_SLUG);

    expect(afterRemoval).toEqual(EXPECTED_REMOVAL_HISTORY);
    expect(afterRemoval[SINGLE_RUN_KEY], 'athletes left without runs are dropped').toBeUndefined();
    expect(afterRemoval[DNF_ONLY_KEY], 'untouched records are shared').toBe(REMOVAL_HISTORY[DNF_ONLY_KEY]);
    expect(afterMissing, 'an unknown slug returns an equivalent history').toEqual(REMOVAL_HISTORY);
    expect(REMOVAL_HISTORY, 'input history must stay untouched').toEqual(snapshot);
  });

  it('makes re-publication idempotent for DNF contributions (remove + apply)', () => {
    const withMisspelled = applyEventToHistory({}, DNF_REPUBLISH_EVENT, MISSPELLED_DNF_RESULTS);
    const reapplied = applyEventToHistory(withMisspelled, DNF_REPUBLISH_EVENT, MISSPELLED_DNF_RESULTS);

    expect(reapplied[MISSPELLED_DNF_KEY].participationSlugs, 'an already registered slug is never duplicated').toEqual([
      DNF_REPUBLISH_EVENT.slug,
    ]);

    const republished = applyEventToHistory(
      removeEventFromHistory(withMisspelled, DNF_REPUBLISH_EVENT.slug),
      DNF_REPUBLISH_EVENT,
      CORRECTED_DNF_RESULTS,
    );

    expect(republished[MISSPELLED_DNF_KEY], 'the misspelled DNF ghost is gone').toBeUndefined();
    expect(Object.keys(republished), 'only the corrected participant remains').toEqual([DNF_ONLY_KEY]);

    const initial = applyEventToHistory(applyEventToHistory({}, RUN_EVENT, MIXED_RUN_RESULTS), DNF_EVENT, MIXED_DNF_RESULTS);
    const afterRunRepublish = applyEventToHistory(removeEventFromHistory(initial, RUN_EVENT.slug), RUN_EVENT, MIXED_RUN_RESULTS);

    expect(afterRunRepublish[MIXED_ATHLETE_KEY], 'the DNF participation on the other event survives').toEqual(EXPECTED_MIXED_RECORD);
  });
});

describe('historyBeforeDate', () => {
  it('keeps strictly older runs and participations, recomputes bests, drops emptied athletes and shares untouched records', () => {
    const snapshot = structuredClone(BEFORE_DATE_HISTORY);
    const before = historyBeforeDate(BEFORE_DATE_HISTORY, CUTOFF_DATE_ISO);

    expect(before).toEqual(EXPECTED_BEFORE_DATE_HISTORY);
    expect(before[MIXED_DATES_KEY], 'the cutoff date itself is excluded').not.toBe(BEFORE_DATE_HISTORY[MIXED_DATES_KEY]);
    expect(before[CUTOFF_ONLY_KEY], 'an athlete without older participations is dropped').toBeUndefined();
    expect(before[OLDER_ONLY_KEY], 'untouched records are shared').toBe(BEFORE_DATE_HISTORY[OLDER_ONLY_KEY]);
    expect(BEFORE_DATE_HISTORY, 'input history must stay untouched').toEqual(snapshot);
  });
});
