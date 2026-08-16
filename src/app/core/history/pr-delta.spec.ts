import { prDelta, previousBestBySlug, previousYearBestBySlug } from './pr-delta';
import { PrDeltaKind } from './pr-delta.enum';
import {
  EXPECTED_PREVIOUS_BEST_BY_SLUG,
  EXPECTED_PREVIOUS_YEAR_BEST_BY_SLUG,
  PR_DELTA_CAREER,
  PR_DELTA_FASTER_MS,
  PR_DELTA_RECORD_MS,
  PR_DELTA_SLOWER_MS,
} from './pr-delta.mock';

describe('prDelta', () => {
  it('signs the gap to the record and names the side it fell on', () => {
    expect(prDelta(PR_DELTA_SLOWER_MS, PR_DELTA_RECORD_MS)).toEqual({ kind: PrDeltaKind.slower, text: '+0:31,00' });
    expect(prDelta(PR_DELTA_FASTER_MS, PR_DELTA_RECORD_MS)).toEqual({ kind: PrDeltaKind.faster, text: '−0:21,00' });
    expect(prDelta(PR_DELTA_RECORD_MS, PR_DELTA_RECORD_MS), 'the exact repeat carries no sign').toEqual({
      kind: PrDeltaKind.equal,
      text: '0:00,00',
    });
  });

  it('stays blank without a time of its own or a record to chase', () => {
    expect(prDelta(null, PR_DELTA_RECORD_MS), 'a DNF or one-lap row').toBeNull();
    expect(prDelta(PR_DELTA_SLOWER_MS, undefined), 'a debut').toBeNull();
  });
});

describe('previousBestBySlug', () => {
  it('gives every run the record that stood before its own race day', () => {
    expect(Object.fromEntries(previousBestBySlug(PR_DELTA_CAREER))).toEqual(EXPECTED_PREVIOUS_BEST_BY_SLUG);
    expect(previousBestBySlug([]).size, 'no runs — no records').toBe(0);
  });
});

describe('previousYearBestBySlug', () => {
  it('bounds that record to the run’s own year', () => {
    expect(Object.fromEntries(previousYearBestBySlug(PR_DELTA_CAREER))).toEqual(EXPECTED_PREVIOUS_YEAR_BEST_BY_SLUG);
  });
});
