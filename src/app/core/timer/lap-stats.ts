import { Gender, GenderType } from '../models/gender.enum';
import { LapStats, LapStatsSample } from './lap-stats.interface';
import { expectedLapMsByAthlete } from './runner-order';

/**
 * The whole archive read the timer needs, boiled out of the 2.3 km splits that are loaded anyway
 * for the tile order (docs/TIMER.md §4, §5). One pass gives the live «Круг» table its two marks —
 * the athlete's own best lap and the course record on the first lap — and the roster sheet its
 * regularity count for «постоянные участники». Athletes with no gender in the archive count towards
 * their own numbers but never towards a course record: the nomination is per gender or nothing.
 */
export function buildLapStats(samples: readonly LapStatsSample[]): LapStats {
  const bestLapMs = new Map<string, number>();
  const appearanceCount = new Map<string, number>();
  const courseRecordLapMs: Record<GenderType, number | null> = { [Gender.male]: null, [Gender.female]: null };

  for (const sample of samples) {
    bestLapMs.set(sample.key, fasterMs(bestLapMs.get(sample.key) ?? null, sample.lapMs));
    appearanceCount.set(sample.key, (appearanceCount.get(sample.key) ?? 0) + 1);

    if (sample.gender !== null) {
      courseRecordLapMs[sample.gender] = fasterMs(courseRecordLapMs[sample.gender], sample.lapMs);
    }
  }

  return { expectedLapMs: expectedLapMsByAthlete(samples), bestLapMs, appearanceCount, courseRecordLapMs };
}

/** The faster of a standing best and one more lap; nothing standing yet loses to any lap. */
function fasterMs(bestMs: number | null, lapMs: number): number {
  return bestMs === null ? lapMs : Math.min(bestMs, lapMs);
}
