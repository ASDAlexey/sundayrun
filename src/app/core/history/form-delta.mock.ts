import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { FormDeltaKind } from './form-delta.enum';
import { FormBaseline, FormDelta } from './form-delta.interface';
import { ParticipantRun } from './notables.interface';

/** The race every baseline below is taken as of — the morning the protocol describes. */
export const FORM_DELTA_RACE_ISO = '2026-06-28';

const МАРИЯ = 'мария иванова';

const ОЛЕГ = 'олег петров';

const АННА = 'анна сидорова';

function run(athleteKey: string, dateIso: string, timeMs: number, distanceKm = FIVE_KM_DISTANCE_KM): ParticipantRun {
  return { athleteKey, dateIso, slug: dateIso, timeMs, distanceKm };
}

/**
 * One field covering every branch of the baseline scan. Мария has six 5 km finishes behind her, so
 * the window has to drop the oldest — her January 17:00, which would drag the median down by a
 * quarter minute if the scan took everything. She also has a one-lap run, a run on race day itself
 * and one from the following month: none of the three may reach the window.
 *
 * Олег brings a single finish (a median of one), Анна a finish from January and nothing since.
 */
export const FORM_DELTA_RUNS: ParticipantRun[] = [
  run(МАРИЯ, '2026-01-11', 1020000),
  run(МАРИЯ, '2026-02-08', 1290000),
  run(МАРИЯ, '2026-03-08', 1260000),
  run(МАРИЯ, '2026-04-12', 1230000),
  run(МАРИЯ, '2026-05-10', 1200000),
  run(МАРИЯ, '2026-06-14', 1170000),
  run(МАРИЯ, '2026-06-21', 540000, TWO_THREE_KM_DISTANCE_KM),
  run(МАРИЯ, FORM_DELTA_RACE_ISO, 1250000),
  run(МАРИЯ, '2026-07-05', 1100000),
  run(ОЛЕГ, '2026-06-07', 1200000),
  run(АННА, '2026-01-04', 1200000),
];

/** Мария's five newest: 21:30, 21:00, 20:30, 20:00 and 19:30 — a median of 20:30 flat. */
export const EXPECTED_FORM_BASELINES: Record<string, FormBaseline> = {
  [МАРИЯ]: { medianMs: 1230000, runCount: 5, latestIso: '2026-06-14' },
  [ОЛЕГ]: { medianMs: 1200000, runCount: 1, latestIso: '2026-06-07' },
  [АННА]: { medianMs: 1200000, runCount: 1, latestIso: '2026-01-04' },
};

export const МАРИЯ_BASELINE = EXPECTED_FORM_BASELINES[МАРИЯ];

export const ОЛЕГ_BASELINE = EXPECTED_FORM_BASELINES[ОЛЕГ];

export const АННА_BASELINE = EXPECTED_FORM_BASELINES[АННА];

/** 20 seconds off the 20:30 median — well inside the 36,9 s corridor 3% of it comes to. */
export const FORM_DELTA_USUAL_MS = 1250000;

/** Exactly 36,9 s slower: the last result the corridor still holds, and the `<=` that holds it. */
export const FORM_DELTA_CORRIDOR_EDGE_MS = 1266900;

/** 1:10 slower — past the corridor, and stated plainly. */
export const FORM_DELTA_SLOWER_MS = 1300000;

/** 50 seconds better than an ordinary day. */
export const FORM_DELTA_FASTER_MS = 1180000;

/** Анна's January finish to this June race: the break that stops the column counting. */
export const EXPECTED_BREAK_REST_DAYS = 175;

/** The three deltas the text helpers have to dress, without going through the scan to get them. */
export const FORM_DELTA_USUAL: FormDelta = { kind: FormDeltaKind.usual, text: '≈ +0:20,00', restDays: 14 };

export const FORM_DELTA_SINGLE: FormDelta = { kind: FormDeltaKind.slower, text: '+1:40,00', restDays: 21 };

export const FORM_DELTA_BREAK: FormDelta = { kind: FormDeltaKind.afterBreak, text: '', restDays: EXPECTED_BREAK_REST_DAYS };

export const EXPECTED_FORM_DELTA_MEDIAN_HINT = 'Обычно 20:30,00 — по 5 последним забегам';

export const EXPECTED_FORM_DELTA_SINGLE_HINT = 'Прошлый забег — 20:00,00';

export const EXPECTED_FORM_DELTA_BREAK_HINT = 'Перерыв 175 дней — прежняя форма уже не мерка';

export const EXPECTED_FORM_DELTA_BREAK_TEXT = 'После перерыва';
