import { NoteBadgeKindType } from '../../../core/protocol/note-badge-kind.enum';

/** One recognized note token as an icon chip; `plain` renders as running text. */
export interface PreviewNoteBadgeView {
  kind: NoteBadgeKindType;
  className: string;
  text: string;
}

/** Precomputed presentation of one table row, so the template stays free of function calls. */
export interface ParticipantRowView {
  /** The source participant id — the gender toggle writes through it. */
  id: number;
  index: number;
  fullName: string;
  time23: string;
  time5: string;
  paceText: string;
  unverified: boolean;
  isMale: boolean;
  isFemale: boolean;
  placeMText: string;
  placeFText: string;
  placeMMedalClass: string;
  placeFMedalClass: string;
  gapMText: string;
  gapFText: string;
  finishCountText: string;
  finishClubClass: string;
  /** «+0:31» — how far the row landed from the record standing before this race; blank without one. */
  prDeltaText: string;
  /** The tint of that figure («preview__pr-delta_faster»); empty for the exact repeat and a blank cell. */
  prDeltaClass: string;
  /** The hint behind it: «ЛР 19:46,00 · 12 янв 2025»; empty for a blank cell. */
  prDeltaHint: string;
  club: string;
  /** The auto-generated note exactly as the protocol will show it, split into badge chips. */
  noteBadges: PreviewNoteBadgeView[];
}
