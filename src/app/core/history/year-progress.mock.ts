import { type HistoryRunRow } from './badge-signals.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { type YearProgressRow } from './year-progress.interface';

export const PROGRESS_YEAR = '2026';

const SPRINTER = 'быстров пётр';

const STEADY = 'ровнова анна';

const TWIN = 'иванова белла';

const SPARSE = 'малов олег';

const SLOWER = 'медленнов игорь';

const NEWCOMER = 'новиков юрий';

const DEPARTED = 'ушедший семён';

/** Key → display name of everyone who finished in the reviewed year (the departed one did not). */
export const PROGRESS_DISPLAY_NAMES: ReadonlyMap<string, string> = new Map([
  [SPRINTER, 'Быстров Пётр'],
  [STEADY, 'Ровнова Анна'],
  [TWIN, 'Иванова Белла'],
  [SPARSE, 'Малов Олег'],
  [SLOWER, 'Медленнов Игорь'],
  [NEWCOMER, 'Новиков Юрий'],
]);

const run = (
  athleteKey: string,
  { dateIso, timeMs, distanceKm = FIVE_KM_DISTANCE_KM }: { dateIso: string; timeMs: number; distanceKm?: number },
): HistoryRunRow => ({
  athleteKey,
  dateIso,
  timeMs,
  distanceKm,
});

/**
 * Быстров cuts his median by 2:10 (a short-course 2026 run must stay out of the medians);
 * Ровнова and Иванова improve by the same 0:30, so their tie breaks by name; Малов has only two
 * previous-season finishes, Медленнов got slower, Новиков debuted this year and Ушедший ran the
 * previous season only — none of the four may surface.
 */
export const PROGRESS_HISTORY_ROWS: HistoryRunRow[] = [
  run(SPRINTER, { dateIso: '2025-03-02', timeMs: 1800000 }),
  run(SPRINTER, { dateIso: '2025-04-06', timeMs: 1830000 }),
  run(SPRINTER, { dateIso: '2025-05-04', timeMs: 1860000 }),
  run(SPRINTER, { dateIso: '2026-02-01', timeMs: 1680000 }),
  run(SPRINTER, { dateIso: '2026-03-01', timeMs: 1700000 }),
  run(SPRINTER, { dateIso: '2026-04-05', timeMs: 1740000 }),
  run(SPRINTER, { dateIso: '2026-04-12', timeMs: 600000, distanceKm: TWO_THREE_KM_DISTANCE_KM }),
  run(STEADY, { dateIso: '2025-03-02', timeMs: 1620000 }),
  run(STEADY, { dateIso: '2025-04-06', timeMs: 1620000 }),
  run(STEADY, { dateIso: '2025-05-04', timeMs: 1620000 }),
  run(STEADY, { dateIso: '2026-02-01', timeMs: 1590000 }),
  run(STEADY, { dateIso: '2026-03-01', timeMs: 1590000 }),
  run(STEADY, { dateIso: '2026-04-05', timeMs: 1590000 }),
  run(TWIN, { dateIso: '2025-03-02', timeMs: 1500000 }),
  run(TWIN, { dateIso: '2025-04-06', timeMs: 1500000 }),
  run(TWIN, { dateIso: '2025-05-04', timeMs: 1500000 }),
  run(TWIN, { dateIso: '2026-02-01', timeMs: 1470000 }),
  run(TWIN, { dateIso: '2026-03-01', timeMs: 1470000 }),
  run(TWIN, { dateIso: '2026-04-05', timeMs: 1470000 }),
  run(SPARSE, { dateIso: '2025-03-02', timeMs: 1800000 }),
  run(SPARSE, { dateIso: '2025-04-06', timeMs: 1800000 }),
  run(SPARSE, { dateIso: '2026-02-01', timeMs: 1500000 }),
  run(SPARSE, { dateIso: '2026-03-01', timeMs: 1500000 }),
  run(SPARSE, { dateIso: '2026-04-05', timeMs: 1500000 }),
  run(SLOWER, { dateIso: '2025-03-02', timeMs: 1500000 }),
  run(SLOWER, { dateIso: '2025-04-06', timeMs: 1500000 }),
  run(SLOWER, { dateIso: '2025-05-04', timeMs: 1500000 }),
  run(SLOWER, { dateIso: '2026-02-01', timeMs: 1560000 }),
  run(SLOWER, { dateIso: '2026-03-01', timeMs: 1560000 }),
  run(SLOWER, { dateIso: '2026-04-05', timeMs: 1560000 }),
  run(NEWCOMER, { dateIso: '2026-02-01', timeMs: 1500000 }),
  run(NEWCOMER, { dateIso: '2026-03-01', timeMs: 1500000 }),
  run(NEWCOMER, { dateIso: '2026-04-05', timeMs: 1500000 }),
  run(DEPARTED, { dateIso: '2025-03-02', timeMs: 1500000 }),
  run(DEPARTED, { dateIso: '2025-04-06', timeMs: 1500000 }),
  run(DEPARTED, { dateIso: '2025-05-04', timeMs: 1500000 }),
];

export const EXPECTED_PROGRESS_ROWS: YearProgressRow[] = [
  { key: SPRINTER, displayName: 'Быстров Пётр', previousMedianMs: 1830000, currentMedianMs: 1700000, deltaMs: 130000 },
  { key: TWIN, displayName: 'Иванова Белла', previousMedianMs: 1500000, currentMedianMs: 1470000, deltaMs: 30000 },
  { key: STEADY, displayName: 'Ровнова Анна', previousMedianMs: 1620000, currentMedianMs: 1590000, deltaMs: 30000 },
];
