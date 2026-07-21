import { EMPTY_FIRST_LAP_RECORDS } from './first-lap.constant';
import { AthleteFirstLap, FirstLapRun } from './first-lap.interface';
import { FirstLapRecords } from './first-lap.type';

/**
 * The standing first-lap (2.3 km) record per gender: the fastest recorded split, regardless of
 * whether the 5 km was finished. The record belongs to the athlete who ran the split first — a
 * later equal split never takes it over, mirroring the course-record semantics.
 */
export function firstLapRecords(runs: readonly FirstLapRun[]): FirstLapRecords {
  const records: FirstLapRecords = { ...EMPTY_FIRST_LAP_RECORDS };

  for (const run of runs) {
    const standing = records[run.gender];

    if (standing === null || beatsRecord(run, standing)) {
      records[run.gender] = run;
    }
  }

  return records;
}

/** The athlete's own fastest first lap, or null without a recorded split; the earliest run keeps a tie. */
export function bestFirstLap(laps: readonly AthleteFirstLap[]): AthleteFirstLap | null {
  let best: AthleteFirstLap | null = null;

  for (const lap of laps) {
    if (best === null || beatsRecord(lap, best)) {
      best = lap;
    }
  }

  return best;
}

/** Faster wins; an equal split goes to the earlier run. */
function beatsRecord(candidate: AthleteFirstLap, standing: AthleteFirstLap): boolean {
  return candidate.lapMs < standing.lapMs || (candidate.lapMs === standing.lapMs && candidate.dateIso < standing.dateIso);
}
