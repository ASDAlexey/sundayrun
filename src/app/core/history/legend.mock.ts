import { LegendBoard, LegendFinish, LegendProgress } from './legend.interface';

const ANTONOV_KEY = 'антонов андрей';

const BORISOV_KEY = 'борисов борис';

const finish = (key: string, dateIso: string): LegendFinish => ({
  key,
  displayName: key === ANTONOV_KEY ? 'Антонов Андрей' : 'Борисов Борис',
  dateIso,
});

/** A one-week window keeps the boundary arithmetic readable: 2026-06-21 anchors 2026-06-15…21. */
export const LEGEND_TEST_WINDOW_DAYS = 7;

/** The default 90-day window anchored at 2026-06-21 opens on 2026-03-24; the 03-23 finish is out. */
export const DEFAULT_WINDOW_FINISHES: readonly LegendFinish[] = [
  finish(ANTONOV_KEY, '2026-03-23'),
  finish(ANTONOV_KEY, '2026-03-24'),
  finish(ANTONOV_KEY, '2026-06-21'),
];

export const EXPECTED_DEFAULT_WINDOW_BOARD: LegendBoard = {
  windowStartIso: '2026-03-24',
  legend: { key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' },
  standings: [{ key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' }],
};

/**
 * Антонов has two windowed finishes against Борисов's one; his 06-14 run falls out of the week.
 * His finishes arrive newest first on purpose — the tally must not rely on the input order.
 */
export const WEEKLY_FINISHES: readonly LegendFinish[] = [
  finish(ANTONOV_KEY, '2026-06-14'),
  finish(ANTONOV_KEY, '2026-06-21'),
  finish(ANTONOV_KEY, '2026-06-15'),
  finish(BORISOV_KEY, '2026-06-15'),
];

export const EXPECTED_WEEKLY_BOARD: LegendBoard = {
  windowStartIso: '2026-06-15',
  legend: { key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' },
  standings: [
    { key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' },
    { key: BORISOV_KEY, displayName: 'Борисов Борис', finishCount: 1, lastFinishIso: '2026-06-15' },
  ],
};

/** Both reach two finishes, but Борисов got his second earlier — the tie keeps his crown. */
export const TIED_COUNT_FINISHES: readonly LegendFinish[] = [
  finish(ANTONOV_KEY, '2026-06-15'),
  finish(ANTONOV_KEY, '2026-06-21'),
  finish(BORISOV_KEY, '2026-06-15'),
  finish(BORISOV_KEY, '2026-06-20'),
];

export const EXPECTED_TIED_COUNT_BOARD: LegendBoard = {
  windowStartIso: '2026-06-15',
  legend: { key: BORISOV_KEY, displayName: 'Борисов Борис', finishCount: 2, lastFinishIso: '2026-06-20' },
  standings: [
    { key: BORISOV_KEY, displayName: 'Борисов Борис', finishCount: 2, lastFinishIso: '2026-06-20' },
    { key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' },
  ],
};

/** Identical tallies on identical dates — only the name keeps the order deterministic. */
export const NAME_TIE_FINISHES: readonly LegendFinish[] = [
  finish(BORISOV_KEY, '2026-06-15'),
  finish(BORISOV_KEY, '2026-06-21'),
  finish(ANTONOV_KEY, '2026-06-15'),
  finish(ANTONOV_KEY, '2026-06-21'),
];

export const EXPECTED_NAME_TIE_BOARD: LegendBoard = {
  windowStartIso: '2026-06-15',
  legend: { key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' },
  standings: [
    { key: ANTONOV_KEY, displayName: 'Антонов Андрей', finishCount: 2, lastFinishIso: '2026-06-21' },
    { key: BORISOV_KEY, displayName: 'Борисов Борис', finishCount: 2, lastFinishIso: '2026-06-21' },
  ],
};

export const EMPTY_LEGEND_BOARD: LegendBoard = { windowStartIso: '', legend: null, standings: [] };

/** [label, finishes, windowDays (undefined exercises the 90-day default), expected board]. */
export const LEGEND_BOARD_CASES: readonly (readonly [string, readonly LegendFinish[], number | undefined, LegendBoard])[] = [
  ['no finishes — an empty board', [], LEGEND_TEST_WINDOW_DAYS, EMPTY_LEGEND_BOARD],
  [
    'the default 90-day window includes its first day and drops the day before',
    DEFAULT_WINDOW_FINISHES,
    undefined,
    EXPECTED_DEFAULT_WINDOW_BOARD,
  ],
  ['windowed finishes are tallied per athlete, the top one is crowned', WEEKLY_FINISHES, LEGEND_TEST_WINDOW_DAYS, EXPECTED_WEEKLY_BOARD],
  ['a tied count goes to whoever reached it first', TIED_COUNT_FINISHES, LEGEND_TEST_WINDOW_DAYS, EXPECTED_TIED_COUNT_BOARD],
  ['a full tie falls back to the name order', NAME_TIE_FINISHES, LEGEND_TEST_WINDOW_DAYS, EXPECTED_NAME_TIE_BOARD],
];

const WEEKLY_LEGEND = EXPECTED_WEEKLY_BOARD.legend;

/** [label, board, athleteKey, expected progress] — all read off `EXPECTED_WEEKLY_BOARD`. */
export const LEGEND_PROGRESS_CASES: readonly (readonly [string, LegendBoard, string, LegendProgress])[] = [
  [
    'the holder keeps the crown with nothing left to earn',
    EXPECTED_WEEKLY_BOARD,
    ANTONOV_KEY,
    { isLegend: true, finishCount: 2, finishesToCrown: 0, legend: WEEKLY_LEGEND },
  ],
  [
    "the chaser needs to beat the holder's count, not just match it",
    EXPECTED_WEEKLY_BOARD,
    BORISOV_KEY,
    { isLegend: false, finishCount: 1, finishesToCrown: 2, legend: WEEKLY_LEGEND },
  ],
  [
    'an athlete outside the window starts the full climb',
    EXPECTED_WEEKLY_BOARD,
    'новикова нина',
    { isLegend: false, finishCount: 0, finishesToCrown: 3, legend: WEEKLY_LEGEND },
  ],
  [
    'a vacant title goes to the very first finisher',
    EMPTY_LEGEND_BOARD,
    ANTONOV_KEY,
    { isLegend: false, finishCount: 0, finishesToCrown: 1, legend: null },
  ],
];
