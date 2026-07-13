import { Rival, RivalRun } from './rivals.interface';

/**
 * Three events of «Герой Геннадий», every own time 25:00, plus seven neighbours covering every
 * branch of the scan: a three-time shadow with a draw, a 10-second boundary gap, a count tie broken
 * by the gap total, a fifth qualifier dropped by the limit, a single close finish dropped by the
 * minimum, a never-close runner and a row at an event the athlete missed.
 */
export const RIVAL_ATHLETE_KEY = 'герой геннадий';

export const RIVAL_SCAN_YEAR = '2025';

const OWN_MS = 1_500_000;

const run = (key: string, displayName: string, dateIso: string, timeMs: number): RivalRun => ({
  key,
  displayName,
  dateIso,
  slug: dateIso,
  timeMs,
});

const hero = (dateIso: string): RivalRun => run(RIVAL_ATHLETE_KEY, 'Герой Геннадий', dateIso, OWN_MS);

export const RIVAL_ROWS: RivalRun[] = [
  hero('2025-01-01'),
  hero('2025-02-02'),
  hero('2026-03-03'),
  // Тень: three close finishes — two ahead of the hero and one dead heat.
  run('тень тимур', 'Тень Тимур', '2025-01-01', OWN_MS - 3000),
  run('тень тимур', 'Тень Тимур', '2025-02-02', OWN_MS),
  run('тень тимур', 'Тень Тимур', '2026-03-03', OWN_MS - 9000),
  // Ровнов: two close finishes, one win each — the tightest of the two-time rivals (10 s total).
  run('ровнов роман', 'Ровнов Роман', '2025-01-01', OWN_MS + 5000),
  run('ровнов роман', 'Ровнов Роман', '2025-02-02', OWN_MS - 5000),
  // Плотный: two close finishes, 15 s total.
  run('плотный павел', 'Плотный Павел', '2025-01-01', OWN_MS + 6000),
  run('плотный павел', 'Плотный Павел', '2026-03-03', OWN_MS + 9000),
  // Граничный: a gap of exactly ten seconds still counts as close; 15 s total ties Плотный,
  // so the pair falls through to the name tie-break.
  run('граничный глеб', 'Граничный Глеб', '2025-02-02', OWN_MS + 10_000),
  run('граничный глеб', 'Граничный Глеб', '2026-03-03', OWN_MS - 5000),
  // Предельный: qualifies with 20 s total but is the fifth rival — the limit drops him.
  run('предельный пётр', 'Предельный Пётр', '2025-01-01', OWN_MS + 10_000),
  run('предельный пётр', 'Предельный Пётр', '2025-02-02', OWN_MS + 10_000),
  // Разовый: a single close finish is a coincidence, not a rivalry.
  run('разовый родион', 'Разовый Родион', '2025-01-01', OWN_MS + 1000),
  // Разовый at an event the hero missed — the row must be ignored, not counted.
  run('разовый родион', 'Разовый Родион', '2025-04-04', OWN_MS),
  // Далёкий: always twenty seconds behind — never close.
  run('далёкий демид', 'Далёкий Демид', '2025-01-01', OWN_MS + 20_000),
  run('далёкий демид', 'Далёкий Демид', '2025-02-02', OWN_MS + 20_000),
];

/** All-time top: Тень leads on the count, the two-time rivals rank by gap totals, a tied total by name. */
export const EXPECTED_RIVALS: Rival[] = [
  { key: 'тень тимур', displayName: 'Тень Тимур', closeCount: 3, wins: 0, losses: 2, draws: 1 },
  { key: 'ровнов роман', displayName: 'Ровнов Роман', closeCount: 2, wins: 1, losses: 1, draws: 0 },
  { key: 'граничный глеб', displayName: 'Граничный Глеб', closeCount: 2, wins: 1, losses: 1, draws: 0 },
  { key: 'плотный павел', displayName: 'Плотный Павел', closeCount: 2, wins: 2, losses: 0, draws: 0 },
];

/** The 2025 season only: the 2026 finishes drop out, so Предельный enters and the one-timers leave. */
export const EXPECTED_YEAR_RIVALS: Rival[] = [
  { key: 'тень тимур', displayName: 'Тень Тимур', closeCount: 2, wins: 0, losses: 1, draws: 1 },
  { key: 'ровнов роман', displayName: 'Ровнов Роман', closeCount: 2, wins: 1, losses: 1, draws: 0 },
  { key: 'предельный пётр', displayName: 'Предельный Пётр', closeCount: 2, wins: 2, losses: 0, draws: 0 },
];
