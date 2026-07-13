import { AthleteRun } from '../models/athlete-history.interface';
import { AthleteForm } from './form.interface';

const MINUTE_MS = 60_000;
const FORM_SLUG = '2025-form';

/**
 * Eight monthly finishes: five steady 24-minute runs, then three 30-minute ones — the form fades
 * after the May peak. The newest run comes first to prove the input order never matters.
 */
export const FADING_FORM_RUNS: readonly AthleteRun[] = [
  { dateIso: '2025-08-03', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-01-05', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-02-02', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-03-02', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-04-06', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-05-04', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-06-01', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-07-06', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
];

/** The median holds 24 minutes until three slow runs stack up; the peak stays at the earliest lowest window. */
export const EXPECTED_FADING_FORM: AthleteForm = {
  points: [
    { dateIso: '2025-05-04', medianMs: 24 * MINUTE_MS, percent: 100 },
    { dateIso: '2025-06-01', medianMs: 24 * MINUTE_MS, percent: 100 },
    { dateIso: '2025-07-06', medianMs: 24 * MINUTE_MS, percent: 100 },
    { dateIso: '2025-08-03', medianMs: 30 * MINUTE_MS, percent: 80 },
  ],
  peak: { dateIso: '2025-05-04', medianMs: 24 * MINUTE_MS, percent: 100 },
  current: { dateIso: '2025-08-03', medianMs: 30 * MINUTE_MS, percent: 80 },
};

/** The mirror history: five slow runs, then three fast ones — the athlete is at the peak right now. */
export const IMPROVING_FORM_RUNS: readonly AthleteRun[] = [
  { dateIso: '2025-01-05', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-02-02', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-03-02', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-04-06', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-05-04', slug: FORM_SLUG, timeMs: 30 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-06-01', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-07-06', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
  { dateIso: '2025-08-03', slug: FORM_SLUG, timeMs: 24 * MINUTE_MS, distanceKm: 5 },
];

export const EXPECTED_IMPROVING_FORM: AthleteForm = {
  points: [
    { dateIso: '2025-05-04', medianMs: 30 * MINUTE_MS, percent: 80 },
    { dateIso: '2025-06-01', medianMs: 30 * MINUTE_MS, percent: 80 },
    { dateIso: '2025-07-06', medianMs: 30 * MINUTE_MS, percent: 80 },
    { dateIso: '2025-08-03', medianMs: 24 * MINUTE_MS, percent: 100 },
  ],
  peak: { dateIso: '2025-08-03', medianMs: 24 * MINUTE_MS, percent: 100 },
  current: { dateIso: '2025-08-03', medianMs: 24 * MINUTE_MS, percent: 100 },
};

/** One finish short of a full window — no form yet. */
export const SHORT_FORM_RUNS: readonly AthleteRun[] = FADING_FORM_RUNS.slice(0, 4);
