import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';

import { Gender } from '../../../core/models/gender.enum';
import { INITIAL_PUBLISH_STATUS } from '../../../core/timer/timer-session.constant';
import { TimerRole, TimerRunnerOutcome, TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerRunner, TimerSession, TimerSplit } from '../../../core/timer/timer-session.interface';
import {
  IVANOV_ATHLETE_KEY,
  IVANOV_LAP_MS,
  IVANOV_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_ATHLETE_KEY,
  POPOV_ALEKSEY_LAP_MS,
  POPOV_ALEKSEY_RUNNER_ID,
  POPOV_IGOR_ATHLETE_KEY,
  POPOV_IGOR_LAP_MS,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_ATHLETE_KEY,
  ROMANENKO_LAP_MS,
  ROMANENKO_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
  TIMER_SESSION_CREATED_AT_MS,
  TIMER_SESSION_DATE_ISO,
  TROILIN_ATHLETE_KEY,
  TROILIN_LAP_MS,
  TROILIN_RUNNER_ID,
} from '../../../core/timer/timer-session.mock';
import { TIMER_SHELF_MIN_RUNNERS } from './runner-grid.constant';
import { TimerDensity, TimerDensityChoice, TimerDensityChoiceType, TimerDensityType } from './runner-grid.enum';
import { TimerTileView } from './runner-grid.interface';

/** The archive medians behind the pre-start order; Соколова and Кузнецов are unknown to it. */
export const GRID_EXPECTED_LAP_MS: ReadonlyMap<string, number> = new Map([
  [TROILIN_ATHLETE_KEY, TROILIN_LAP_MS],
  [POPOV_IGOR_ATHLETE_KEY, POPOV_IGOR_LAP_MS],
  [ROMANENKO_ATHLETE_KEY, ROMANENKO_LAP_MS],
  [POPOV_ALEKSEY_ATHLETE_KEY, POPOV_ALEKSEY_LAP_MS],
  [IVANOV_ATHLETE_KEY, IVANOV_LAP_MS],
]);

/** Fastest expected lap first; the two people the archive has never seen wait at the end. */
export const GRID_EXPECTED_ORDER: readonly string[] = [
  TROILIN_RUNNER_ID,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_RUNNER_ID,
  POPOV_ALEKSEY_RUNNER_ID,
  IVANOV_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
];

/** An order the judge arranged by hand, with one id that has since left the roster. */
export const GRID_STALE_ORDER: readonly string[] = [KUZNETSOV_RUNNER_ID, 'runner-went-home', TROILIN_RUNNER_ID];

/** What the frozen order keeps of it: the survivors in place, everybody else appended. */
export const GRID_FROZEN_ORDER: readonly string[] = [
  KUZNETSOV_RUNNER_ID,
  TROILIN_RUNNER_ID,
  POPOV_ALEKSEY_RUNNER_ID,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
  IVANOV_RUNNER_ID,
];

/** How many runners a density step is asked about, and which step it has to answer with. */
export interface GridDensityCase {
  choice: TimerDensityChoiceType;
  density: TimerDensityType;
  runnerCount: number;
}

/** Every threshold plus one manual pick — the arithmetic of the 390 × 844 budget. */
export const GRID_DENSITY_CASES: readonly GridDensityCase[] = [
  { choice: TimerDensityChoice.auto, density: TimerDensity.large, runnerCount: 12 },
  { choice: TimerDensityChoice.auto, density: TimerDensity.medium, runnerCount: 13 },
  { choice: TimerDensityChoice.auto, density: TimerDensity.medium, runnerCount: 21 },
  { choice: TimerDensityChoice.auto, density: TimerDensity.small, runnerCount: 22 },
  { choice: TimerDensityChoice.auto, density: TimerDensity.small, runnerCount: 24 },
  { choice: TimerDensityChoice.auto, density: TimerDensity.dense, runnerCount: 25 },
  { choice: TimerDensityChoice.large, density: TimerDensity.large, runnerCount: 30 },
];

export const PLAIN_LEADER_ID = 'runner-plain-leader';
export const PLAIN_SECOND_ID = 'runner-plain-second';
export const PLAIN_THIRD_ID = 'runner-plain-third';

/** Three unrelated surnames: the only roster where a dense layout may shorten a first name. */
export const GRID_PLAIN_RUNNERS: TimerRunner[] = [
  {
    id: PLAIN_LEADER_ID,
    fullName: 'Лебедев Сергей',
    athleteKey: 'лебедев сергей',
    gender: Gender.male,
    outcome: TimerRunnerOutcome.active,
  },
  {
    id: PLAIN_SECOND_ID,
    fullName: 'Волкова Ольга',
    athleteKey: 'волкова ольга',
    gender: Gender.female,
    outcome: TimerRunnerOutcome.active,
  },
  { id: PLAIN_THIRD_ID, fullName: 'Морозов', athleteKey: null, gender: Gender.male, outcome: TimerRunnerOutcome.active },
];

/** The same three before the start: nothing recorded, so the order is still open. */
export const GRID_PLAIN_SESSION: TimerSession = {
  id: 'session-plain',
  dateIso: TIMER_SESSION_DATE_ISO,
  createdAtMs: TIMER_SESSION_CREATED_AT_MS,
  startedAtEpochMs: null,
  stoppedAtMs: null,
  status: TimerStatus.idle,
  role: TimerRole.main,
  runners: GRID_PLAIN_RUNNERS,
  splits: [],
  publish: INITIAL_PUBLISH_STATUS,
};

/** The same three with the clock running — the state a tap is allowed in. */
export const GRID_PLAIN_RUNNING: TimerSession = {
  ...GRID_PLAIN_SESSION,
  startedAtEpochMs: TIMER_SESSION_CREATED_AT_MS,
  status: TimerStatus.running,
};

/** Лебедев already has his lap, so the next tap on him is a finish. */
export const GRID_PLAIN_LAP_SPLIT: TimerSplit = { id: 'split-plain-lap', atMs: TROILIN_LAP_MS, runnerId: PLAIN_LEADER_ID };

export const GRID_PLAIN_AFTER_LAP: TimerSession = { ...GRID_PLAIN_RUNNING, splits: [GRID_PLAIN_LAP_SPLIT] };

/** Волкова withdrew; her tile is greyed out and refuses every tap. */
export const GRID_PLAIN_RETIRED: TimerSession = {
  ...GRID_PLAIN_RUNNING,
  runners: [GRID_PLAIN_RUNNERS[0], { ...GRID_PLAIN_RUNNERS[1], outcome: TimerRunnerOutcome.dnf }, GRID_PLAIN_RUNNERS[2]],
};

const CROWD_FINISHER_LAP_MS = 700_000;

/** Twenty-five minutes flat — the time both fixture finishers came home in. */
const FINISH_MS = 1_500_000;

/** The Sunday the shelf was built for: twenty-five people, one of them already home. */
export const GRID_CROWD_RUNNERS: TimerRunner[] = Array.from({ length: TIMER_SHELF_MIN_RUNNERS }, (_unused, index) => ({
  id: `runner-crowd-${index}`,
  fullName: `Бегун${index} Имя${index}`,
  athleteKey: null,
  gender: Gender.male,
  outcome: TimerRunnerOutcome.active,
}));

export const CROWD_FINISHER_ID = GRID_CROWD_RUNNERS[0].id;

export const GRID_CROWD_SESSION: TimerSession = {
  ...GRID_PLAIN_RUNNING,
  id: 'session-crowd',
  runners: GRID_CROWD_RUNNERS,
  splits: [
    { id: 'split-crowd-lap', atMs: CROWD_FINISHER_LAP_MS, runnerId: CROWD_FINISHER_ID },
    { id: 'split-crowd-finish', atMs: FINISH_MS, runnerId: CROWD_FINISHER_ID },
  ],
};

/** Лебедев has finished too, so his tile is spent and refuses the next tap. */
export const GRID_PLAIN_AFTER_FINISH: TimerSession = {
  ...GRID_PLAIN_RUNNING,
  splits: [GRID_PLAIN_LAP_SPLIT, { id: 'split-plain-finish', atMs: FINISH_MS, runnerId: PLAIN_LEADER_ID }],
};

/** The monotonic «сейчас» of a second tap that has left the three-second undo window behind. */
export const GRID_LATE_TAP_MS = 1_300_000;

/** The time a tap at the stubbed clock writes down, and the one a late tap writes instead. */
export const GRID_TAP_TIME_TEXT = '20:35';
export const GRID_LATE_TAP_TIME_TEXT = '21:40';

/** The finish the crowd's first man home carries, as the shelf prints it. */
export const GRID_CROWD_FINISH_TEXT = '25:00';

/** How long after a tap the shelf is allowed to move anything. */
export const GRID_QUIET_ELAPSED_MS = 5_000_000;

/** The three plain surnames in roster order — the archive knows none of them, so nothing re-sorts. */
export const GRID_PLAIN_SURNAMES: readonly string[] = ['Лебедев', 'Волкова', 'Морозов'];

/** And their first names cut down for the densest layout; one word alone leaves the line empty. */
export const GRID_PLAIN_INITIALS: readonly string[] = ['С.', 'О.', ''];

/** The full roster in expected-lap order, as the tile labels spell it. */
export const GRID_EXPECTED_LABELS: readonly string[] = [
  'Троилин Антон',
  'Попов Игорь',
  'Романенко Елена',
  'Попов Алексей',
  'Иванов Дмитрий',
  'Соколова Анна',
  'Кузнецов Пётр',
];

/** Namesakes in the roster spell every first name out, however dense the grid gets. */
export const GRID_SPELLED_GIVEN: readonly string[] = ['Антон', 'Игорь', 'Елена', 'Алексей', 'Дмитрий', 'Анна', 'Пётр'];

/** The judge drags the last tile to the front, so it sits under the thumb. */
export const GRID_DROP_FROM = 2;
export const GRID_DROP_TO = 0;

/** And this is the order that leaves behind. */
export const GRID_DRAGGED_SURNAMES: readonly string[] = ['Морозов', 'Лебедев', 'Волкова'];

/** The drop landed right on the container, with no travel worth reporting. */
const GRID_DROP_ORIGIN = { x: 0, y: 0 };

/**
 * A CDK drop event assembled from the live directives of the fixture: a real drag in jsdom needs a
 * layout, and every field of `CdkDragDrop` is required, so the two instances come from the DOM.
 */
export function gridDropEvent(
  container: CdkDropList,
  item: CdkDrag,
  previousIndex: number,
  currentIndex: number,
): CdkDragDrop<TimerTileView[]> {
  return {
    container,
    currentIndex,
    distance: GRID_DROP_ORIGIN,
    dropPoint: GRID_DROP_ORIGIN,
    event: new MouseEvent('mouseup'),
    isPointerOverContainer: true,
    item,
    previousContainer: container,
    previousIndex,
  };
}

/** An id that has just left the roster sits between two live ones: the grid draws no hole for it. */
export const VIEW_GONE_RUNNER_ID = 'runner-went-home';
export const VIEW_ORDER: readonly string[] = [TROILIN_RUNNER_ID, VIEW_GONE_RUNNER_ID, KUZNETSOV_RUNNER_ID];

/** Троилин's newest time as the tile prints it, and the surname and first name it splits into. */
export const VIEW_TROILIN_TIME_TEXT = '23:26';
export const VIEW_TROILIN_SURNAME = 'Троилин';
export const VIEW_TROILIN_GIVEN = 'Антон';

/** The same person spelled with ё and with е: the ink has to survive the protocol's spelling. */
export const INK_NAME_YO = 'Кузнецов Пётр';
export const INK_NAME_YE = 'Кузнецов Петр';

/** A spread of names whose inks all have to land inside `--chart-1 … --chart-15`. */
export const INK_SAMPLE_NAMES: readonly string[] = [
  'Троилин Антон',
  'Хахуцкий Виктор',
  'Романенко Елена',
  'Попов Алексей',
  'Иванов Дмитрий',
  'Сидорова Мария',
  'Кузнецов Игорь',
  'Соколова Анна',
  'Морозов Пётр',
  'Волкова Ольга',
  'Лебедев Сергей',
  'Новиков Илья',
  'Егорова Дарья',
  'Зайцев Роман',
  'Павлов Кирилл',
  'Я',
];

/** A full name with untidy whitespace, the initial it is cut to, and the surname it starts with. */
export const NAME_UNTIDY = '  Попов   Алексей  ';
export const NAME_SURNAME = 'Попов';
export const NAME_GIVEN = 'Алексей';
export const NAME_INITIAL = 'А.';

/** One word only — there is no first name to show and none is invented. */
export const NAME_SINGLE = 'Троилин';
