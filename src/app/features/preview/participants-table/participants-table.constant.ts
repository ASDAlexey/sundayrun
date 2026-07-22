import { NoteBadgeKind, NoteBadgeKindType } from '../../../core/protocol/note-badge-kind.enum';

/** Absent time, place, count or note cells stay blank, matching the published protocol. */
export const EMPTY_CELL_TEXT = '';

/** Leads the Smashrun-style «до следующего места» gap under the gender place: «+0:12». */
export const GAP_TEXT_PREFIX = '+';

/** The BEM modifier of each badge kind; `plain` renders as running text and carries no chip. */
export const NOTE_BADGE_CLASSES: Record<NoteBadgeKindType, string> = {
  [NoteBadgeKind.record]: 'participants-table__note-badge_record',
  [NoteBadgeKind.yearBest]: 'participants-table__note-badge_year-best',
  [NoteBadgeKind.debut]: 'participants-table__note-badge_debut',
  [NoteBadgeKind.kids]: 'participants-table__note-badge_kids',
  [NoteBadgeKind.status]: 'participants-table__note-badge_status',
  [NoteBadgeKind.plain]: '',
};

/** Medal palette of the top-3 gender places, reusing the year-badge gold/silver/bronze scale. */
export const PLACE_MEDAL_CLASSES: Record<number, string> = {
  1: 'participants-table__medal_gold',
  2: 'participants-table__medal_silver',
  3: 'participants-table__medal_bronze',
};

/**
 * The finisher clubs, 5-вёрст style, mirroring the published protocol page.
 * Ordered highest first — the first tier the count reaches names the BEM modifier.
 */
export const FINISH_CLUB_TIERS: readonly { min: number; className: string }[] = [
  { min: 250, className: 'participants-table__finishes_250' },
  { min: 100, className: 'participants-table__finishes_100' },
  { min: 50, className: 'participants-table__finishes_50' },
  { min: 25, className: 'participants-table__finishes_25' },
];
