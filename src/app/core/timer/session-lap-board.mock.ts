import { LapBoardRow } from './session-lap-board.interface';
import { TimerSession } from './timer-session.interface';
import {
  FIRST_UNNAMED_SPLIT_ID,
  IVANOV_LAP_MS,
  IVANOV_LAP_SPLIT_ID,
  IVANOV_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_LAP_MS,
  POPOV_ALEKSEY_LAP_SPLIT_ID,
  POPOV_ALEKSEY_RUNNER_ID,
  POPOV_IGOR_LAP_MS,
  POPOV_IGOR_LAP_SPLIT_ID,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_LAP_MS,
  ROMANENKO_LAP_SPLIT_ID,
  ROMANENKO_RUNNER_ID,
  SECOND_UNNAMED_SPLIT_ID,
  SOKOLOVA_LAP_MS,
  SOKOLOVA_LAP_SPLIT_ID,
  SOKOLOVA_RUNNER_ID,
  TIMER_SESSION,
  TROILIN_LAP_MS,
  TROILIN_LAP_SPLIT_ID,
  TROILIN_RUNNER_ID,
} from './timer-session.mock';

/** Two queued times between Троилин's lap and Попов Игорь's — «пачка из четырёх» in the round. */
const QUEUED_FIRST_LAP_MS = 600_000;
const QUEUED_SECOND_LAP_MS = 640_000;

const QUEUED_FIRST_GAP_MS = QUEUED_FIRST_LAP_MS - TROILIN_LAP_MS;
const QUEUED_SECOND_GAP_MS = QUEUED_SECOND_LAP_MS - TROILIN_LAP_MS;

function buildLapBoardRow(position: number, runnerId: string, splitId: string, fullName: string, lapMs: number): LapBoardRow {
  return { position, splitId, runnerId, fullName, lapMs, gapMs: lapMs - TROILIN_LAP_MS };
}

/** Everybody with a timed lap, leader first — the retired ones keep the lap they really ran. */
export const EXPECTED_LAP_BOARD: LapBoardRow[] = [
  buildLapBoardRow(1, TROILIN_RUNNER_ID, TROILIN_LAP_SPLIT_ID, 'Троилин Антон', TROILIN_LAP_MS),
  buildLapBoardRow(2, POPOV_IGOR_RUNNER_ID, POPOV_IGOR_LAP_SPLIT_ID, 'Попов Игорь', POPOV_IGOR_LAP_MS),
  buildLapBoardRow(3, ROMANENKO_RUNNER_ID, ROMANENKO_LAP_SPLIT_ID, 'Романенко Елена', ROMANENKO_LAP_MS),
  buildLapBoardRow(4, POPOV_ALEKSEY_RUNNER_ID, POPOV_ALEKSEY_LAP_SPLIT_ID, 'Попов Алексей', POPOV_ALEKSEY_LAP_MS),
  buildLapBoardRow(5, SOKOLOVA_RUNNER_ID, SOKOLOVA_LAP_SPLIT_ID, 'Соколова Анна', SOKOLOVA_LAP_MS),
  buildLapBoardRow(6, IVANOV_RUNNER_ID, IVANOV_LAP_SPLIT_ID, 'Иванов Дмитрий', IVANOV_LAP_MS),
];

/**
 * The very case the queued places were built for: a lap tapped by name, two times with nobody on them
 * and a fourth man named after both. Nothing is finished yet, and two runners have not been tapped at
 * all — so both queued times hold a place.
 */
export const QUEUED_LAP_BOARD_SESSION: TimerSession = {
  ...TIMER_SESSION,
  splits: [
    { id: TROILIN_LAP_SPLIT_ID, atMs: TROILIN_LAP_MS, runnerId: TROILIN_RUNNER_ID },
    { id: FIRST_UNNAMED_SPLIT_ID, atMs: QUEUED_FIRST_LAP_MS, runnerId: null },
    { id: SECOND_UNNAMED_SPLIT_ID, atMs: QUEUED_SECOND_LAP_MS, runnerId: null },
    { id: POPOV_IGOR_LAP_SPLIT_ID, atMs: POPOV_IGOR_LAP_MS, runnerId: POPOV_IGOR_RUNNER_ID },
  ],
};

/** Both queued times stand between the two surnames, so the man named second is fourth. */
export const EXPECTED_QUEUED_LAP_BOARD: LapBoardRow[] = [
  buildLapBoardRow(1, TROILIN_RUNNER_ID, TROILIN_LAP_SPLIT_ID, 'Троилин Антон', TROILIN_LAP_MS),
  { position: 2, splitId: FIRST_UNNAMED_SPLIT_ID, runnerId: null, fullName: null, lapMs: QUEUED_FIRST_LAP_MS, gapMs: QUEUED_FIRST_GAP_MS },
  {
    position: 3,
    splitId: SECOND_UNNAMED_SPLIT_ID,
    runnerId: null,
    fullName: null,
    lapMs: QUEUED_SECOND_LAP_MS,
    gapMs: QUEUED_SECOND_GAP_MS,
  },
  buildLapBoardRow(4, POPOV_IGOR_RUNNER_ID, POPOV_IGOR_LAP_SPLIT_ID, 'Попов Игорь', POPOV_IGOR_LAP_MS),
];

/** The same board plus a lap tapped at the very time somebody else already had. */
export const TIED_LAP_BOARD_SESSION: TimerSession = {
  ...TIMER_SESSION,
  splits: [...TIMER_SESSION.splits, { id: 'split-tied-lap', atMs: POPOV_ALEKSEY_LAP_MS, runnerId: KUZNETSOV_RUNNER_ID }],
};

/** An equal lap keeps the roster order, exactly like an equal total keeps it in the protocol. */
export const EXPECTED_TIED_LAP_BOARD_IDS: string[] = [
  TROILIN_RUNNER_ID,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_RUNNER_ID,
  POPOV_ALEKSEY_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
  IVANOV_RUNNER_ID,
];
