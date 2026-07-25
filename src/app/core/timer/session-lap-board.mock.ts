import { LapBoardRow } from './session-lap-board.interface';
import { TimerSession } from './timer-session.interface';
import {
  IVANOV_LAP_MS,
  IVANOV_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_LAP_MS,
  POPOV_ALEKSEY_RUNNER_ID,
  POPOV_IGOR_LAP_MS,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_LAP_MS,
  ROMANENKO_RUNNER_ID,
  SOKOLOVA_LAP_MS,
  SOKOLOVA_RUNNER_ID,
  TIMER_SESSION,
  TROILIN_LAP_MS,
  TROILIN_RUNNER_ID,
} from './timer-session.mock';

function buildLapBoardRow(position: number, runnerId: string, fullName: string, lapMs: number): LapBoardRow {
  return { position, runnerId, fullName, lapMs, gapMs: lapMs - TROILIN_LAP_MS };
}

/** Everybody with a timed lap, leader first — the retired ones keep the lap they really ran. */
export const EXPECTED_LAP_BOARD: LapBoardRow[] = [
  buildLapBoardRow(1, TROILIN_RUNNER_ID, 'Троилин Антон', TROILIN_LAP_MS),
  buildLapBoardRow(2, POPOV_IGOR_RUNNER_ID, 'Попов Игорь', POPOV_IGOR_LAP_MS),
  buildLapBoardRow(3, ROMANENKO_RUNNER_ID, 'Романенко Елена', ROMANENKO_LAP_MS),
  buildLapBoardRow(4, POPOV_ALEKSEY_RUNNER_ID, 'Попов Алексей', POPOV_ALEKSEY_LAP_MS),
  buildLapBoardRow(5, SOKOLOVA_RUNNER_ID, 'Соколова Анна', SOKOLOVA_LAP_MS),
  buildLapBoardRow(6, IVANOV_RUNNER_ID, 'Иванов Дмитрий', IVANOV_LAP_MS),
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
