import { type AthleteRecord, type AthleteRun } from '../models/athlete-history.interface';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { ATTENDANCE_PODIUM_SIZE } from './attendance.constant';
import { type AttendanceRow, type SeasonAttendance } from './attendance.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { seasonOfIso } from './seasons';
import { SEASON_ORDER } from './seasons.constant';
import { type SeasonType } from './seasons.enum';

/** How far the board looks: one calendar year, one season inside it, or null for the whole archive. */
export interface AttendanceScope {
  readonly year: string | null;
  readonly season: SeasonType | null;
}

/**
 * The «Кто чаще всех» board: everyone with a 5 km finish inside the scope, the most finishes first
 * (a tie breaks by name in Russian collation). `year` narrows the scan to one calendar year and
 * `season` to one season inside it — with `year` null a season spans the whole archive, so «Лето»
 * sums every summer. Short-course runs and DNFs stay out: this counts finishes, like the
 * protocol's «Финишей» column, so the board and that tally can never disagree.
 */
export function attendanceBoard(records: readonly AthleteRecord[], scope: AttendanceScope): AttendanceRow[] {
  const rows = records.flatMap<Omit<AttendanceRow, 'place'>>((record) => {
    const finishes = record.runs.filter((run) => inScope(run, scope));

    if (finishes.length === 0) {
      return [];
    }

    const last = finishes.reduce((newest, run) => (run.dateIso > newest.dateIso ? run : newest));

    return [
      {
        key: record.key,
        displayName: record.displayName,
        gender: record.gender,
        finishes: finishes.length,
        lastDateIso: last.dateIso,
        lastSlug: last.slug,
      },
    ];
  });

  rows.sort((left, right) => right.finishes - left.finishes || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE));

  return withPlaces(rows);
}

/**
 * The four season podiums of the scope, winter → autumn: everyone the season board placed 1–3.
 * A season nobody ran is skipped, so a card never renders empty.
 */
export function seasonAttendance(records: readonly AthleteRecord[], year: string | null): SeasonAttendance[] {
  return SEASON_ORDER.flatMap<SeasonAttendance>((season) => {
    const rows = attendanceBoard(records, { year, season }).filter((row) => row.place <= ATTENDANCE_PODIUM_SIZE);

    return rows.length === 0 ? [] : [{ season, rows }];
  });
}

/** Competition ranking over the sorted rows: an equal count shares a place, the next count skips ahead. */
function withPlaces(rows: readonly Omit<AttendanceRow, 'place'>[]): AttendanceRow[] {
  let place = 0;
  let previousFinishes: number | null = null;

  return rows.map((row, index) => {
    if (row.finishes !== previousFinishes) {
      place = index + 1;
      previousFinishes = row.finishes;
    }

    return { ...row, place };
  });
}

function inScope(run: AthleteRun, scope: AttendanceScope): boolean {
  return (
    run.distanceKm === FIVE_KM_DISTANCE_KM &&
    (scope.year === null || isoYear(run.dateIso) === scope.year) &&
    (scope.season === null || seasonOfIso(run.dateIso) === scope.season)
  );
}
