import { Gender } from '../models/gender.enum';
import { CourseRecordRun } from './course-records.interface';
import { CourseRecordHistory } from './course-records.type';

/**
 * The course record progression per gender: runs are scanned in date order (ties within one event
 * break by time, so only an event's fastest run can set the record), and every run that beat the
 * then-standing record becomes an entry. Equalling the record never takes it over — the record
 * stays with the athlete who ran the time first. The last entry per gender is the current holder.
 */
export function courseRecordHistory(runs: readonly CourseRecordRun[]): CourseRecordHistory {
  const history: CourseRecordHistory = { [Gender.male]: [], [Gender.female]: [] };
  const ordered = [...runs].sort((left, right) => left.dateIso.localeCompare(right.dateIso) || left.timeMs - right.timeMs);

  for (const run of ordered) {
    const entries = history[run.gender];
    const standingMs = entries.at(-1)?.timeMs ?? null;

    if (standingMs === null || run.timeMs < standingMs) {
      entries.push({ ...run, previousMs: standingMs });
    }
  }

  return history;
}
