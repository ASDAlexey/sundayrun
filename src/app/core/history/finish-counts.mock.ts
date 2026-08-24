import { type ProtocolRow } from '../models/protocol-row.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { type ParticipantRun } from './notables.interface';

/**
 * Participant runs and protocol rows covering both counters: a veteran whose future and
 * short-course runs must not count, a newcomer with the event as the only run, and the publish-time
 * rows where the short-course and DNF participants must stay out of the map.
 */

export const FINISH_COUNT_EVENT_DATE = '2026-06-28';

export const VETERAN_KEY = 'ветеран трассы';

export const NEWCOMER_KEY = 'новичок забега';

const run = (
  athleteKey: string,
  { dateIso, distanceKm = FIVE_KM_DISTANCE_KM }: { dateIso: string; distanceKm?: number },
): ParticipantRun => ({
  athleteKey,
  dateIso,
  slug: dateIso,
  timeMs: 1500000,
  distanceKm,
});

export const FINISH_COUNT_RUNS: ParticipantRun[] = [
  // Three earlier finishes plus the event one; the future and short-course runs never count.
  run(VETERAN_KEY, { dateIso: '2025-05-04' }),
  run(VETERAN_KEY, { dateIso: '2025-06-01' }),
  run(VETERAN_KEY, { dateIso: '2026-02-01' }),
  run(VETERAN_KEY, { dateIso: FINISH_COUNT_EVENT_DATE }),
  run(VETERAN_KEY, { dateIso: '2026-07-05' }),
  run(VETERAN_KEY, { dateIso: '2026-03-01', distanceKm: TWO_THREE_KM_DISTANCE_KM }),
  // The event is the first finish.
  run(NEWCOMER_KEY, { dateIso: FINISH_COUNT_EVENT_DATE }),
];

export const EXPECTED_FINISH_COUNTS_AT: Record<string, number> = {
  [VETERAN_KEY]: 4,
  [NEWCOMER_KEY]: 1,
};

const row = (
  index: number,
  { fullName, totalMs, distanceKm }: { fullName: string; totalMs: number | null; distanceKm: number | null },
): ProtocolRow => ({
  index,
  fullName,
  time23: '',
  time5: '',
  totalMs,
  distanceKm,
  gender: null,
  placeM: null,
  placeF: null,
  club: '',
  note: '',
});

/** The organisers' spelling differs from the key ('Ё', double space) — the lookup must normalize. */
export const FINISH_COUNT_ROWS: ProtocolRow[] = [
  row(1, { fullName: 'Ветеран  Трассы', totalMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM }),
  row(2, { fullName: 'Новичок Забега', totalMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM }),
  row(3, { fullName: 'На Круге', totalMs: 800000, distanceKm: TWO_THREE_KM_DISTANCE_KM }),
  row(4, { fullName: 'Сошёл Сдистанции', totalMs: null, distanceKm: null }),
];

export const PRIOR_FINISH_COUNTS: Record<string, number> = {
  [VETERAN_KEY]: 12,
  // Stored counts of athletes outside the protocol must not leak into the event map.
  'посторонний атлет': 7,
};

export const EXPECTED_EVENT_FINISH_COUNTS: Record<string, number> = {
  [VETERAN_KEY]: 13,
  [NEWCOMER_KEY]: 1,
};
