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

/** mat-table column order, mirroring the nine PDF columns plus the average pace. */
export const RACE_TABLE_COLUMNS = ['index', 'athlete', 'time23', 'time5', 'pace', 'gender', 'placeM', 'placeF', 'club', 'note'];
