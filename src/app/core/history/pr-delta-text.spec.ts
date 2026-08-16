import { prDeltaHint } from './pr-delta-text';
import { EXPECTED_PR_DELTA_HINT, EXPECTED_PR_DELTA_HINT_RECORD_ONLY, PR_DELTA_HINT_BEST, PR_DELTA_HINT_YEAR_BEST } from './pr-delta.mock';

describe('prDeltaHint', () => {
  it('names the record and the season best behind the «Δ ЛР» figure', () => {
    expect(prDeltaHint(PR_DELTA_HINT_BEST, PR_DELTA_HINT_YEAR_BEST)).toBe(EXPECTED_PR_DELTA_HINT);
  });

  it('drops the season clause when it would repeat the record', () => {
    expect(prDeltaHint(PR_DELTA_HINT_BEST, undefined), 'the first race of a year').toBe(EXPECTED_PR_DELTA_HINT_RECORD_ONLY);
    expect(prDeltaHint(PR_DELTA_HINT_BEST, PR_DELTA_HINT_BEST), 'the record was set this year').toBe(EXPECTED_PR_DELTA_HINT_RECORD_ONLY);
  });

  it('stays empty without a record, where no figure is drawn either', () => {
    expect(prDeltaHint(undefined, PR_DELTA_HINT_YEAR_BEST)).toBe('');
  });
});
