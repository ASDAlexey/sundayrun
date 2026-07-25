import { TimerPublishState } from './timer-session.enum';
import { TimerPublishStatus } from './timer-session.interface';

/** Every runner is tapped twice: the 2.3 km lap and the 5 km finish. */
export const MAX_SPLITS_PER_RUNNER = 2;

/** The lap tap inside a runner's own split list. */
export const LAP_SPLIT_INDEX = 0;

/** The finish tap inside a runner's own split list. */
export const FINISH_SPLIT_INDEX = 1;

/** How many splits mean "the lap is behind him". */
export const LAP_DONE_MIN_SPLITS = 1;

/** Fields the timer never fills in: the note is computed on publish, the club is not asked for. */
export const EMPTY_TEXT = '';

/** A fresh session has never been sent anywhere. */
export const INITIAL_PUBLISH_STATUS: TimerPublishStatus = { state: TimerPublishState.local, error: null, sha: null };

/** A roster nobody has been added to — the one state the mass start is refused from. */
export const EMPTY_ROSTER = 0;

/** Participant ids and lap-board positions are 1-based. */
export const FIRST_POSITION = 1;

/** The leader sits first in the ordered lap board. */
export const LEADER_INDEX = 0;

/** The leader of the lap is nobody's chaser. */
export const NO_GAP_MS = 0;

/** `Array.prototype.at` offset of the newest journal entry. */
export const LAST_ENTRY_INDEX = -1;

/** `Array.prototype.slice` end that drops the newest journal entry. */
export const WITHOUT_LAST_ENTRY = -1;

/** Full names are stored as «Фамилия Имя», so the surname is the first token. */
export const SURNAME_INDEX = 0;

/** Separator between the name parts of a full name. */
export const NAME_PART_SEPARATOR = ' ';
