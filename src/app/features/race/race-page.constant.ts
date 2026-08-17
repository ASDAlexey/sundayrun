import { FormDeltaKind, FormDeltaKindType } from '../../core/history/form-delta.enum';
import { PrDeltaKind, PrDeltaKindType } from '../../core/history/pr-delta.enum';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { NoteBadgeKind, NoteBadgeKindType } from '../../core/protocol/note-badge-kind.enum';
import { RaceDeltaView } from './race-page.interface';

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

/** Leads the count of places gained on lap 2 under the finish time: «+3». */
export const LAP_GAIN_PREFIX = '+';

/** Joins the parts of the summary line: «8 финишёров, 2 новичка, 3 личных рекорда». */
export const SUMMARY_PART_SEPARATOR = ', ';

/** The BEM modifier of each badge kind; `plain` renders as running text and carries no chip. */
export const NOTE_BADGE_CLASSES: Record<NoteBadgeKindType, string> = {
  [NoteBadgeKind.record]: 'race__note-badge_record',
  [NoteBadgeKind.yearBest]: 'race__note-badge_year-best',
  [NoteBadgeKind.debut]: 'race__note-badge_debut',
  [NoteBadgeKind.kids]: 'race__note-badge_kids',
  [NoteBadgeKind.status]: 'race__note-badge_status',
  [NoteBadgeKind.plain]: '',
};

/**
 * The tint of a figure measured against a best — the season's or the career's. Green for the run
 * that beat it; everything else is left to read plainly. Falling short of your own record is the
 * ordinary case, not a fault, and a column of red would say the opposite forty times a protocol.
 */
export const PR_DELTA_CLASSES: Record<PrDeltaKindType, string> = {
  [PrDeltaKind.faster]: 'race__delta_faster',
  [PrDeltaKind.slower]: 'race__delta_slower',
  [PrDeltaKind.equal]: '',
};

/**
 * The same for a figure measured against the runner's own form: the corridor's two sides, the quiet
 * middle, and the comeback the column declines to measure at all.
 */
export const FORM_DELTA_CLASSES: Record<FormDeltaKindType, string> = {
  [FormDeltaKind.faster]: 'race__delta_faster',
  [FormDeltaKind.slower]: 'race__delta_slower',
  [FormDeltaKind.usual]: 'race__delta_usual',
  [FormDeltaKind.afterBreak]: 'race__delta_break',
};

/** A cell with nothing to measure: a debut, a one-lap run, a DNF. Drawn as nothing at all. */
export const NO_DELTA: RaceDeltaView = { text: '', className: '', hint: '' };

/** The tinted «Пол» chip: cool blue for М, warm pink for Ж — a light wash telling the groups apart. */
export const GENDER_CHIP_CLASSES: Record<GenderType, string> = {
  [Gender.male]: 'race__gender_male',
  [Gender.female]: 'race__gender_female',
};

/** Medal palette of the top-3 gender places, reusing the year-badge gold/silver/bronze scale. */
export const PLACE_MEDAL_CLASSES: Record<number, string> = {
  1: 'race__medal_gold',
  2: 'race__medal_silver',
  3: 'race__medal_bronze',
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
