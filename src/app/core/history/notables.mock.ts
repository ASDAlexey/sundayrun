import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { NotableKind } from './notables.enum';
import { Notable, ParticipantRun } from './notables.interface';

/**
 * One event's participant runs covering every notables branch: a 2nd and a 3rd career result, a
 * silent rank 1 (the stored «ЛР» note owns it), a history too short to rank, a trailing-window
 * best, a window too thin to count, a short-course run at the event, and a future run that must
 * not rewrite the ranks. The event sits on 2026-06-28, so its 6-month window opens 2025-12-28.
 */

export const NOTABLE_EVENT_SLUG = '2026-06-28';

export const NOTABLE_EVENT_DATE = '2026-06-28';

export const SECOND_RANK_KEY = 'ранкин второй';

export const THIRD_RANK_KEY = 'ранкин третий';

export const RECORD_KEY = 'новый рекордсмен';

export const SHORT_HISTORY_KEY = 'короткая история';

export const WINDOW_BEST_KEY = 'оконный лучший';

export const THIN_WINDOW_KEY = 'тонкое окно';

export const SHORT_COURSE_KEY = 'на круге';

const run = (athleteKey: string, dateIso: string, timeMs: number, slug: string = dateIso): ParticipantRun => ({
  athleteKey,
  dateIso,
  slug,
  timeMs,
  distanceKm: FIVE_KM_DISTANCE_KM,
});

const eventRun = (athleteKey: string, timeMs: number): ParticipantRun => run(athleteKey, NOTABLE_EVENT_DATE, timeMs, NOTABLE_EVENT_SLUG);

export const NOTABLE_EVENT_RUNS: ParticipantRun[] = [
  // Rank 2 of six career runs; the faster 2026-07-05 run happens after the event and must not count.
  run(SECOND_RANK_KEY, '2025-05-04', 1440000),
  run(SECOND_RANK_KEY, '2025-06-01', 1560000),
  run(SECOND_RANK_KEY, '2025-07-06', 1560000),
  run(SECOND_RANK_KEY, '2025-08-03', 1560000),
  run(SECOND_RANK_KEY, '2026-02-01', 1560000),
  run(SECOND_RANK_KEY, '2026-07-05', 1300000),
  eventRun(SECOND_RANK_KEY, 1500000),
  // Rank 3 of exactly five career runs — the minimum history that still ranks.
  run(THIRD_RANK_KEY, '2025-03-02', 1400000),
  run(THIRD_RANK_KEY, '2025-04-06', 1450000),
  run(THIRD_RANK_KEY, '2026-01-04', 1560000),
  run(THIRD_RANK_KEY, '2026-02-01', 1600000),
  eventRun(THIRD_RANK_KEY, 1500000),
  // The fastest career run: rank 1 stays silent, the stored «ЛР» note already marks it.
  run(RECORD_KEY, '2025-05-04', 1560000),
  run(RECORD_KEY, '2025-06-01', 1560000),
  run(RECORD_KEY, '2025-07-06', 1560000),
  run(RECORD_KEY, '2025-08-03', 1560000),
  eventRun(RECORD_KEY, 1500000),
  // Rank 2 of only four runs: too short to rank, and the window still holds a faster run.
  run(SHORT_HISTORY_KEY, '2026-01-04', 1440000),
  run(SHORT_HISTORY_KEY, '2026-02-01', 1560000),
  run(SHORT_HISTORY_KEY, '2026-03-01', 1600000),
  eventRun(SHORT_HISTORY_KEY, 1500000),
  // Rank 4 (three faster runs live before the window), but the best of the three window runs.
  run(WINDOW_BEST_KEY, '2025-01-05', 1380000),
  run(WINDOW_BEST_KEY, '2025-02-02', 1410000),
  run(WINDOW_BEST_KEY, '2025-03-02', 1440000),
  run(WINDOW_BEST_KEY, '2026-01-04', 1560000),
  run(WINDOW_BEST_KEY, '2026-02-01', 1580000),
  run(WINDOW_BEST_KEY, '2026-03-01', 1600000),
  eventRun(WINDOW_BEST_KEY, 1500000),
  // Beats the window, but two runs of company are one short of the threshold.
  run(THIN_WINDOW_KEY, '2025-01-05', 1380000),
  run(THIN_WINDOW_KEY, '2025-02-02', 1410000),
  run(THIN_WINDOW_KEY, '2025-03-02', 1440000),
  run(THIN_WINDOW_KEY, '2026-01-04', 1560000),
  run(THIN_WINDOW_KEY, '2026-02-01', 1560000),
  eventRun(THIN_WINDOW_KEY, 1500000),
  // Ran the short course at this event: no 5 km run at the slug, so nothing to rank.
  { athleteKey: SHORT_COURSE_KEY, dateIso: NOTABLE_EVENT_DATE, slug: NOTABLE_EVENT_SLUG, timeMs: 999000, distanceKm: 2.3 },
  run(SHORT_COURSE_KEY, '2026-02-01', 1560000),
];

export const EXPECTED_EVENT_NOTABLES: Record<string, Notable> = {
  [SECOND_RANK_KEY]: { kind: NotableKind.allTimeRank, rank: 2 },
  [THIRD_RANK_KEY]: { kind: NotableKind.allTimeRank, rank: 3 },
  [WINDOW_BEST_KEY]: { kind: NotableKind.windowBest, rank: null },
};
