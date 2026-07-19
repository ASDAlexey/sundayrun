import { RaceNoteBadgeKind, RaceNoteBadgeKindType } from './race-page.enum';

/** Route param carrying the event slug (`/races/:slug`). */
export const SLUG_ROUTE_PARAM = 'slug';

/** TransferState key prefix; each prerendered protocol bakes its view under `race.view.<slug>`. */
export const RACE_TRANSFER_KEY_PREFIX = 'race.view.';

/** routerLink back to the race list. */
export const HOME_PAGE_LINK = '/';

/** Base of the online protocol routes; append the event slug. */
export const RACE_PAGE_BASE_LINK = '/races';

/** Protocol gender column, matching the published PDF (localized for the online protocol). */
export const MALE_GENDER_TEXT = $localize`:@@race.genderMale:М`;

export const FEMALE_GENDER_TEXT = $localize`:@@race.genderFemale:Ж`;

/** Absent time, place, gender, club or note cells stay blank, matching the published PDF. */
export const EMPTY_CELL_TEXT = '';

/** Leads the Smashrun-style «до следующего места» gap under the gender place: «+0:12». */
export const GAP_TEXT_PREFIX = '+';

/** Joins the parts of the summary line: «8 финишёров, 2 новичка, 3 личных рекорда». */
export const SUMMARY_PART_SEPARATOR = ', ';

/** mat-table column order, mirroring the ten PDF columns plus the average pace. */
export const RACE_TABLE_COLUMNS = ['index', 'athlete', 'time23', 'time5', 'pace', 'gender', 'placeM', 'placeF', 'finishes', 'club', 'note'];

/** Organiser-written kids-run tokens found in the stored notes. */
export const KIDS_NOTE_TOKEN_PATTERN = /^(Дети|Детский забег)$/;

/** DNF/DSQ tokens, with or without a trailing clarification («DNF Детский забег»). */
export const STATUS_NOTE_TOKEN_PATTERN = /^(DNF|DSQ)\b/;

/** The BEM modifier of each badge kind; `plain` renders as running text and carries no chip. */
export const NOTE_BADGE_CLASSES: Record<RaceNoteBadgeKindType, string> = {
  [RaceNoteBadgeKind.record]: 'race__note-badge_record',
  [RaceNoteBadgeKind.yearBest]: 'race__note-badge_year-best',
  [RaceNoteBadgeKind.debut]: 'race__note-badge_debut',
  [RaceNoteBadgeKind.kids]: 'race__note-badge_kids',
  [RaceNoteBadgeKind.status]: 'race__note-badge_status',
  [RaceNoteBadgeKind.plain]: '',
};

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
