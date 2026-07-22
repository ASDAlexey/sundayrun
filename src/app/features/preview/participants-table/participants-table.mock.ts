import { normalizeAthleteKey } from '../../../core/history/athlete-key';
import { Gender, GenderConfidence, GenderSource } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { NoteBadgeKind } from '../../../core/protocol/note-badge-kind.enum';
import { ParticipantRowView } from './participants-table.interface';

export const FULL_DISTANCE_ID = 1;

const FULL_DISTANCE_PARTICIPANT: Participant = {
  id: FULL_DISTANCE_ID,
  fullName: 'Троилин Антон',
  totalMs: 1143028,
  lapsMs: [540000, 603028],
  gender: Gender.male,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.dictionary,
  note: '',
  club: '',
};

const SECOND_MALE_PARTICIPANT: Participant = {
  id: 4,
  fullName: 'Волочек Павел',
  totalMs: 1432000,
  lapsMs: [668000, 764000],
  gender: Gender.male,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.dictionary,
  note: '',
  club: '',
};

const SHORT_DISTANCE_PARTICIPANT: Participant = {
  id: 2,
  fullName: 'Хандыга Наталья',
  totalMs: 600000,
  lapsMs: [600000],
  gender: Gender.female,
  genderConfidence: GenderConfidence.low,
  genderSource: GenderSource.heuristic,
  note: 'после травмы',
  club: '',
};

const DNF_PARTICIPANT: Participant = {
  id: 3,
  fullName: 'Инкогнито',
  totalMs: null,
  lapsMs: [],
  gender: null,
  genderConfidence: GenderConfidence.unknown,
  genderSource: GenderSource.unknown,
  note: '',
  club: '',
};

/** Two verified 5 km males, an unverified 2.3 km female and a gender-less DNF without laps. */
export const TABLE_PARTICIPANTS: Participant[] = [
  FULL_DISTANCE_PARTICIPANT,
  SECOND_MALE_PARTICIPANT,
  SHORT_DISTANCE_PARTICIPANT,
  DNF_PARTICIPANT,
];

/** ISO date of the active draft the finish counts anchor to. */
export const TABLE_DATE_ISO = '2026-06-14';

/** A second draft date, used to drop an in-flight stale finish-count read. */
export const OTHER_DATE_ISO = '2026-06-21';

/** Stored 5 km finishes strictly before the draft date, keyed like the archive. */
export const PRIOR_FINISH_COUNTS: Record<string, number> = {
  [normalizeAthleteKey(FULL_DISTANCE_PARTICIPANT.fullName)]: 114,
};

/** A conflicting stale payload; it must never reach the table. */
export const STALE_FINISH_COUNTS: Record<string, number> = {
  [normalizeAthleteKey(FULL_DISTANCE_PARTICIPANT.fullName)]: 999,
};

/** The rows before the stored counts load: the draft's own finish is already counted («1»). */
export const EXPECTED_ROW_VIEWS: ParticipantRowView[] = [
  {
    id: FULL_DISTANCE_ID,
    index: 1,
    fullName: FULL_DISTANCE_PARTICIPANT.fullName,
    time23: '9:00',
    time5: '19:03',
    paceText: '3:49',
    unverified: false,
    isMale: true,
    isFemale: false,
    placeMText: '1',
    placeFText: '',
    placeMMedalClass: 'participants-table__medal_gold',
    placeFMedalClass: '',
    gapMText: '',
    gapFText: '',
    finishCountText: '1',
    finishClubClass: '',
    club: '',
    noteBadges: [],
  },
  {
    id: SECOND_MALE_PARTICIPANT.id,
    index: 2,
    fullName: SECOND_MALE_PARTICIPANT.fullName,
    time23: '11:08',
    time5: '23:52',
    paceText: '4:46',
    unverified: false,
    isMale: true,
    isFemale: false,
    placeMText: '2',
    placeFText: '',
    placeMMedalClass: 'participants-table__medal_silver',
    placeFMedalClass: '',
    gapMText: '+4:49',
    gapFText: '',
    finishCountText: '1',
    finishClubClass: '',
    club: '',
    noteBadges: [],
  },
  {
    id: SHORT_DISTANCE_PARTICIPANT.id,
    index: 3,
    fullName: SHORT_DISTANCE_PARTICIPANT.fullName,
    time23: '10:00',
    time5: '',
    paceText: '4:21',
    unverified: true,
    isMale: false,
    isFemale: true,
    placeMText: '',
    placeFText: '',
    placeMMedalClass: '',
    placeFMedalClass: '',
    gapMText: '',
    gapFText: '',
    finishCountText: '',
    finishClubClass: '',
    club: '',
    noteBadges: [{ kind: NoteBadgeKind.plain, className: '', text: SHORT_DISTANCE_PARTICIPANT.note }],
  },
  {
    id: DNF_PARTICIPANT.id,
    index: 4,
    fullName: DNF_PARTICIPANT.fullName,
    time23: '',
    time5: '',
    paceText: '',
    unverified: true,
    isMale: false,
    isFemale: false,
    placeMText: '',
    placeFText: '',
    placeMMedalClass: '',
    placeFMedalClass: '',
    gapMText: '',
    gapFText: '',
    finishCountText: '',
    finishClubClass: '',
    club: '',
    noteBadges: [],
  },
];

/** 114 stored finishes + this draft's own = the «115» badge in the 100-club tint. */
export const EXPECTED_LOADED_FINISH_TEXT = '115';

export const EXPECTED_LOADED_FINISH_CLASS = 'participants-table__finishes_100';

/** aria-pressed of the М/Ж toggle pairs for TABLE_PARTICIPANTS, in template order. */
export const EXPECTED_ARIA_PRESSED: string[] = ['true', 'false', 'true', 'false', 'false', 'true', 'false', 'false'];

/** The gold and silver medals of the two male finishers. */
export const EXPECTED_MEDAL_COUNT = 2;

/** The «Участий» cell when only the draft's own finish is known (a failed or empty archive read). */
export const OWN_FINISH_ONLY_TEXT = '1';

/** Every header cell must be marked as a column header for screen readers. */
export const COLUMN_SCOPE = 'col';

/** TABLE_PARTICIPANTS rows with an unverified gender, each carrying a visually-hidden hint. */
export const EXPECTED_UNVERIFIED_HINT_COUNT = 2;
