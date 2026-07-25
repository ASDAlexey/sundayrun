import { buildLapStats } from './lap-stats';
import {
  EMPTY_LAP_STATS,
  LAP_STATS_APPEARANCE_ENTRIES,
  LAP_STATS_BEST_ENTRIES,
  LAP_STATS_COURSE_RECORD,
  LAP_STATS_EXPECTED_ENTRIES,
  LAP_STATS_SAMPLES,
} from './lap-stats.mock';

describe('buildLapStats', () => {
  it('takes the median, the personal best and the appearance count per athlete, and the record per gender', () => {
    const stats = buildLapStats(LAP_STATS_SAMPLES);

    expect([...stats.expectedLapMs]).toEqual(LAP_STATS_EXPECTED_ENTRIES);
    expect([...stats.bestLapMs]).toEqual(LAP_STATS_BEST_ENTRIES);
    expect([...stats.appearanceCount]).toEqual(LAP_STATS_APPEARANCE_ENTRIES);
    expect(stats.courseRecordLapMs, 'an athlete with no gender never holds a course record').toEqual(LAP_STATS_COURSE_RECORD);
  });

  it('has nothing to say about an archive without a single timed first lap', () => {
    expect(buildLapStats([])).toEqual(EMPTY_LAP_STATS);
  });
});
