import { athleteSignalsOf, badgeSignalsByAthlete, comebackYearsOf, slowFinishCountsOf } from './badge-signals';
import {
  COMEBACK_RUNS,
  EXPECTED_COMEBACK_YEARS,
  EXPECTED_SIGNALS_BY_ATHLETE,
  EXPECTED_SLOW_COUNTS,
  HISTORY_ROWS,
  SLOW_RUNS,
} from './badge-signals.mock';

describe('comebackYearsOf', () => {
  it('flags the years of a finish after a 90+ day break, boundary inclusive, never the first run', () => {
    expect(comebackYearsOf(COMEBACK_RUNS)).toEqual(EXPECTED_COMEBACK_YEARS);
    expect(comebackYearsOf([]), 'no runs — no comebacks').toEqual(new Set());
  });
});

describe('slowFinishCountsOf', () => {
  it('counts per year the 5 km finishes strictly slower than the all-time 5 km median', () => {
    expect(slowFinishCountsOf(SLOW_RUNS)).toEqual(EXPECTED_SLOW_COUNTS);
    expect(slowFinishCountsOf([]), 'no runs — no median, no counts').toEqual({});
  });
});

describe('badgeSignalsByAthlete', () => {
  it('computes both signals per athlete over the interleaved archive rows', () => {
    const signals = badgeSignalsByAthlete(HISTORY_ROWS);

    expect(signals).toEqual(EXPECTED_SIGNALS_BY_ATHLETE);
    expect(athleteSignalsOf(signals, 'anna')).toEqual(EXPECTED_SIGNALS_BY_ATHLETE.get('anna'));
    expect(athleteSignalsOf(signals, 'нет такого'), 'an unknown athlete carries empty signals').toEqual({
      comebackYears: new Set(),
      slowFinishCountByYear: {},
    });
  });
});
