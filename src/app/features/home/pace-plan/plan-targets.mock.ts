import { type AthleteRecord, type AthleteRun } from '../../../core/models/athlete-history.interface';
import { Gender } from '../../../core/models/gender.enum';

const MINUTE_MS = 60 * 1000;

/** 21:00 — set two seasons before the finishes below, which is the point of quoting form as well. */
export const TARGETS_BEST_MS = 21 * MINUTE_MS;

/** The median of the five latest finishes: 22:00, 22:30, 23:00, 23:30, 24:00. */
export const TARGETS_FORM_MEDIAN_MS = 23 * MINUTE_MS;

const RUN_MINUTES = [21, 25, 22.5, 23, 22, 24, 23.5];

function toRun(minutes: number, index: number): AthleteRun {
  const day = String(index + 1).padStart(2, '0');

  return { dateIso: `2026-03-${day}`, slug: `2026-03-${day}`, timeMs: minutes * MINUTE_MS, distanceKm: 5 };
}

/** An athlete with a best behind them and a slower current form — the case the card exists for. */
export const TARGETS_RECORD: AthleteRecord = {
  key: 'ivanov-ivan',
  displayName: 'Иванов Иван',
  gender: Gender.male,
  participationSlugs: [],
  runs: RUN_MINUTES.map(toRun),
  bestMs: TARGETS_BEST_MS,
  bestMsByYear: {},
};
