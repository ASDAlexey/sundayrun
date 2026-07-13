import { Gender, GenderConfidence, GenderSource } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { FIVE_KM_TEXT, TWO_THREE_KM_TEXT } from '../../../shared/distance-label.constant';
import { DNF_TEXT, NO_DISTANCE_TEXT, NO_LAP_TEXT, NO_NOTE_TEXT } from './participants-table.constant';
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

/** A verified 5 km male, an unverified 2.3 km female and a gender-less DNF without laps. */
export const TABLE_PARTICIPANTS: Participant[] = [FULL_DISTANCE_PARTICIPANT, SHORT_DISTANCE_PARTICIPANT, DNF_PARTICIPANT];

export const EXPECTED_ROW_VIEWS: ParticipantRowView[] = [
  {
    participant: FULL_DISTANCE_PARTICIPANT,
    timeText: '19:03',
    lap1Text: '9:00',
    lap2Text: '10:03',
    distanceText: FIVE_KM_TEXT,
    unverified: false,
    isMale: true,
    isFemale: false,
    noteText: NO_NOTE_TEXT,
  },
  {
    participant: SHORT_DISTANCE_PARTICIPANT,
    timeText: '10:00',
    lap1Text: '10:00',
    lap2Text: NO_LAP_TEXT,
    distanceText: TWO_THREE_KM_TEXT,
    unverified: true,
    isMale: false,
    isFemale: true,
    noteText: SHORT_DISTANCE_PARTICIPANT.note,
  },
  {
    participant: DNF_PARTICIPANT,
    timeText: DNF_TEXT,
    lap1Text: NO_LAP_TEXT,
    lap2Text: NO_LAP_TEXT,
    distanceText: NO_DISTANCE_TEXT,
    unverified: true,
    isMale: false,
    isFemale: false,
    noteText: NO_NOTE_TEXT,
  },
];

/** aria-pressed of the М/Ж toggle pairs for TABLE_PARTICIPANTS, in template order. */
export const EXPECTED_ARIA_PRESSED: string[] = ['true', 'false', 'false', 'true', 'false', 'false'];

/** Every header cell must be marked as a column header for screen readers. */
export const COLUMN_SCOPE = 'col';

/** TABLE_PARTICIPANTS rows with an unverified gender, each carrying a visually-hidden hint. */
export const EXPECTED_UNVERIFIED_HINT_COUNT = 2;
