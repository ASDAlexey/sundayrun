import { AthleteRecord } from '../../../core/models/athlete-history.interface';
import { Gender, GenderType } from '../../../core/models/gender.enum';
import { INITIAL_PUBLISH_STATUS } from '../../../core/timer/timer-session.constant';
import { TimerRole, TimerRunnerOutcome, TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerRunner, TimerSession } from '../../../core/timer/timer-session.interface';

const record = (key: string, displayName: string, gender: GenderType | null): AthleteRecord => ({
  key,
  displayName,
  gender,
  participationSlugs: [],
  runs: [],
  bestMs: null,
  bestMsByYear: {},
});

const runner = (id: string, fullName: string, athleteKey: string | null, gender: GenderType | null): TimerRunner => ({
  id,
  fullName,
  athleteKey,
  gender,
  outcome: TimerRunnerOutcome.active,
});

export const TROILIN_KEY = 'троилин антон';
export const HAHUTSKIY_KEY = 'хахуцкий виктор';
export const ROMANENKO_KEY = 'романенко елена';
export const KUZNETSOV_KEY = 'кузнецов петр';
export const POPOV_KEY = 'попов алексей';
export const ZAYTSEV_KEY = 'зайцев роман';
export const SIDOROVA_KEY = 'сидорова мария';

/**
 * A directory with everything the sheet has to survive: men, a woman, a pair tied on appearances so
 * the alphabet tie-break shows, and somebody the archive has neither a gender nor a single lap for.
 */
export const PICKER_RECORDS: AthleteRecord[] = [
  record(POPOV_KEY, 'Попов Алексей', Gender.male),
  record(TROILIN_KEY, 'Троилин Антон', Gender.male),
  record(SIDOROVA_KEY, 'Сидорова Мария', null),
  record(ZAYTSEV_KEY, 'Зайцев Роман', Gender.male),
  record(ROMANENKO_KEY, 'Романенко Елена', Gender.female),
  record(KUZNETSOV_KEY, 'Кузнецов Пётр', Gender.male),
  record(HAHUTSKIY_KEY, 'Хахуцкий Виктор', Gender.male),
];

/** Timed first laps in the archive. Сидорова is absent on purpose — she has never been timed. */
export const PICKER_APPEARANCES: ReadonlyMap<string, number> = new Map([
  [TROILIN_KEY, 84],
  [HAHUTSKIY_KEY, 61],
  [ROMANENKO_KEY, 47],
  [KUZNETSOV_KEY, 47],
  [ZAYTSEV_KEY, 39],
  [POPOV_KEY, 39],
]);

/** Normalizes to `хахуцкий` and matches exactly one directory entry. */
export const PICKER_QUERY = ' ХАХУЦКИЙ ';

/** Two characters are already a list — the shortest query the sheet answers with names. */
export const PICKER_SHORT_QUERY = 'ро';

/** Everyone whose key holds `ро`, alphabetically; Попов is left out, he is already in the roster. */
export const PICKER_SHORT_QUERY_NAMES = ['Зайцев Роман', 'Романенко Елена', 'Сидорова Мария', 'Троилин Антон'];

/** Appearances descending, ties by the alphabet; Попов is missing because he already runs today. */
export const PICKER_REGULAR_NAMES = [
  'Троилин Антон',
  'Хахуцкий Виктор',
  'Кузнецов Пётр',
  'Романенко Елена',
  'Зайцев Роман',
  'Сидорова Мария',
];

export const PICKER_SESSION_ID = 'session-picker-active';
export const PICKER_PREVIOUS_SESSION_ID = 'session-picker-previous';
export const PICKER_EMPTY_SESSION_ID = 'session-picker-empty';

export const POPOV_RUNNER_ID = 'runner-popov';
export const SOKOLOVA_RUNNER_ID = 'runner-sokolova';

/** Соколова came in as a newcomer, so nobody ever told the sheet her gender. */
export const PICKER_SESSION_RUNNERS: TimerRunner[] = [
  runner(POPOV_RUNNER_ID, 'Попов Алексей', POPOV_KEY, Gender.male),
  runner(SOKOLOVA_RUNNER_ID, 'Соколова Анна', null, null),
];

const session = (id: string, runners: TimerRunner[]): TimerSession => ({
  id,
  dateIso: '2026-07-26',
  createdAtMs: 1_785_000_000_000,
  startedAtEpochMs: null,
  stoppedAtMs: null,
  status: TimerStatus.idle,
  role: TimerRole.main,
  runners,
  tileOrder: [],
  splits: [],
  publish: INITIAL_PUBLISH_STATUS,
});

export const PICKER_SESSION: TimerSession = session(PICKER_SESSION_ID, PICKER_SESSION_RUNNERS);

/** Last Sunday: two of these three are already standing in the active line-up. */
export const PICKER_PREVIOUS_SESSION: TimerSession = session(PICKER_PREVIOUS_SESSION_ID, [
  runner('runner-previous-popov', 'Попов Алексей', POPOV_KEY, Gender.male),
  runner('runner-previous-sokolova', 'Соколова Анна', null, null),
  runner('runner-previous-hahutskiy', 'Хахуцкий Виктор', HAHUTSKIY_KEY, Gender.male),
]);

/** A measurement whose roster was never collected — «как в прошлый раз» must skip right over it. */
export const PICKER_EMPTY_SESSION: TimerSession = session(PICKER_EMPTY_SESSION_ID, []);

/** «Попов Игорь» typed by hand, sloppily: the sheet re-cases it and warns about the namesake. */
export const NEWCOMER_RAW_NAME = ' попов   ИГОРЬ ';

export const NEWCOMER_FULL_NAME = 'Попов Игорь';

/** The surname the duplicate warning names. */
export const NEWCOMER_TWIN_SURNAME = 'Попов';

/** A woman the dictionary resolves with no help — the toggle only has to confirm the guess. */
export const NEWCOMER_FEMALE_NAME = 'Кузнецова Анна';

/** One token is not a participant: «Готово» for the newcomer form stays out of reach. */
export const NEWCOMER_INCOMPLETE_NAME = 'Попов';

/** Whitespace only — the same refusal as an empty box. */
export const NEWCOMER_BLANK_NAME = '   ';

/** Typed carelessly, but the archive already has exactly this person — the sheet says so. */
export const NEWCOMER_KNOWN_NAME = 'троилин антон';

/** «Добавить «Троилин Антон»» — the key spells out what it is about to write down. */
export const NEWCOMER_KNOWN_DISPLAY_NAME = 'Троилин Антон';

/** Somewhere in the middle of a Sunday; the sheet only ever prints its day and month. */
export const PICKER_CACHED_AT_MS = 1_785_000_000_000;

/** «Справочник от 26.07» — the day and month depend on the runner's timezone, the shape does not. */
export const PICKER_ROSTER_AGE_PATTERN = /^Справочник от \d{2}\.\d{2}$/;

/** «М · 84 забега» — what the meta line of the top regular reads. */
export const TROILIN_META_TEXT = 'М · 84 забега';

/** A woman with 47 timed laps — the plural form the archive hits most often. */
export const ROMANENKO_META_TEXT = 'Ж · 47 забегов';

/** No gender and no laps in the archive: both fallbacks in one line. */
export const SIDOROVA_META_TEXT = 'пол не указан · 0 забегов';

/** One person still owes the sheet a gender. */
export const PICKER_MISSING_GENDER_TEXT = 'Уточните пол: 1 человек';

/** Two regulars ticked and not yet written — what the footer promises. */
export const PICKER_ADD_CHECKED_TEXT = 'Добавить · 2';

/** The same footer once the two joined the pair already standing there. */
export const PICKER_DONE_TEXT = 'Готово · 4';

/** The receipt of one newcomer, of a pair added at once, and of what is left when one of them goes. */
export const PICKER_JUST_ADDED_ONE_TEXT = 'Добавили «Попов Игорь»';
export const PICKER_JUST_ADDED_BATCH = 2;
export const PICKER_JUST_ADDED_BATCH_TEXT = 'Добавили 2 человека';
export const PICKER_JUST_ADDED_LEFT_TEXT = 'Добавили «Троилин Антон»';
