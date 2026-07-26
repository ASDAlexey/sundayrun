import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { AttendanceRow, SeasonAttendance } from '../../core/history/attendance.interface';
import { pluralText } from '../../core/i18n/plural-text';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { FEMALE_GENDER_TEXT, MALE_GENDER_TEXT, RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ATTENDANCE_ALL_TIME_SCOPE, ATTENDANCE_MEDALS, SEASON_LABELS, UNKNOWN_GENDER_TEXT } from './records-page.constant';
import { AttendanceRowView, SeasonAttendanceView } from './records-page.interface';

/** The «Кто чаще всех» rows prepared for the template: medals for the top three, numbers below. */
export function toAttendanceViews(rows: readonly AttendanceRow[]): AttendanceRowView[] {
  return rows.map((row) => ({
    place: row.place,
    medal: row.place <= ATTENDANCE_MEDALS.length ? ATTENDANCE_MEDALS[row.place - 1] : null,
    key: row.key,
    athleteLink: [ATHLETES_PAGE_LINK, row.key],
    displayName: row.displayName,
    gender: row.gender,
    genderText: genderTextOf(row.gender),
    finishesText: String(row.finishes),
    countText: finishesText(row.finishes),
    dateShort: formatRussianDateShort(row.lastDateIso),
    raceLink: [RACE_PAGE_BASE_LINK, row.lastSlug],
  }));
}

/** «Лето 2026» over the season's podium; «Все годы» widens every card to the whole archive. */
export function toSeasonAttendanceViews(podiums: readonly SeasonAttendance[], year: string | null): SeasonAttendanceView[] {
  return podiums.map((podium) => ({
    title: `${SEASON_LABELS[podium.season]} ${year ?? ATTENDANCE_ALL_TIME_SCOPE}`,
    rows: toAttendanceViews(podium.rows),
  }));
}

function genderTextOf(gender: GenderType | null): string {
  if (gender === null) {
    return UNKNOWN_GENDER_TEXT;
  }

  return gender === Gender.male ? MALE_GENDER_TEXT : FEMALE_GENDER_TEXT;
}

/** «12 финишей» — the podium card tally in the ru plural forms. */
function finishesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@records.attendanceFinishesOne:${count}:count: финиш`,
    few: $localize`:@@records.attendanceFinishesFew:${count}:count: финиша`,
    many: $localize`:@@records.attendanceFinishesMany:${count}:count: финишей`,
  });
}
