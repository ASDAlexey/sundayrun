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
  club: string;
  /** The auto-generated note exactly as the protocol will show it, split into badge chips. */
  noteBadges: PreviewNoteBadgeView[];
}
