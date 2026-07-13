/** Route param carrying the event slug (`/races/:slug`). */
export const SLUG_ROUTE_PARAM = 'slug';

/** routerLink back to the race list. */
export const HOME_PAGE_LINK = '/';

/** Base of the online protocol routes; append the event slug. */
export const RACE_PAGE_BASE_LINK = '/races';

/** Protocol gender column, matching the published PDF (localized for the online protocol). */
export const MALE_GENDER_TEXT = $localize`:@@race.genderMale:М`;

export const FEMALE_GENDER_TEXT = $localize`:@@race.genderFemale:Ж`;

/** Absent time, place, gender, club or note cells stay blank, matching the published PDF. */
export const EMPTY_CELL_TEXT = '';

/** Joins the parts of the summary line: «8 финишёров, 2 новичка, 3 личных рекорда». */
export const SUMMARY_PART_SEPARATOR = ', ';

/** mat-table column order, mirroring the ten PDF columns plus the average pace. */
export const RACE_TABLE_COLUMNS = ['index', 'athlete', 'time23', 'time5', 'pace', 'gender', 'placeM', 'placeF', 'finishes', 'club', 'note'];

/**
 * The finisher clubs, 5-вёрст style: the badge of the «Финишей» cell warms up at each milestone.
 * Ordered highest first — the first tier the count reaches names the BEM modifier.
 */
export const FINISH_CLUB_TIERS: readonly { min: number; className: string }[] = [
  { min: 250, className: 'race__finishes_250' },
  { min: 100, className: 'race__finishes_100' },
  { min: 50, className: 'race__finishes_50' },
  { min: 25, className: 'race__finishes_25' },
];
