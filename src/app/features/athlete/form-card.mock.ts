import { IMPROVING_FORM_RUNS } from '../../core/history/form.mock';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { FormView } from './form-card.interface';

/** Exactly one full window: five equal runs ending in May — the athlete is at the peak by definition. */
export const SINGLE_WINDOW_RUNS: readonly AthleteRun[] = IMPROVING_FORM_RUNS.slice(0, 5);

/** An anchor on the newest finish's day keeps a run set fresh; a run set's own newest date works too. */
export const FADING_ANCHOR_ISO = '2025-08-03';
export const SINGLE_WINDOW_ANCHOR_ISO = '2025-05-04';

/** Four months past the newest fading finish — the whole card reads as a season-long break. */
export const FADING_STALE_ANCHOR_ISO = '2025-12-15';

/** FADING_FORM_RUNS mapped into the 560×120 viewBox: three peak windows on top, the fade dropping to the floor. */
export const EXPECTED_FADING_FORM_VIEW: FormView = {
  currentPercent: 80,
  isAtPeak: false,
  isStale: false,
  peakMonthText: 'мае 2025',
  linePoints: '8,8 189.3,8 370.7,8 552,112',
  points: [
    { x: 8, y: 8, tooltip: '4 май 2025 · 24:00 · 100%', isPeak: true, isCurrent: false },
    { x: 189.3, y: 8, tooltip: '1 июн 2025 · 24:00 · 100%', isPeak: false, isCurrent: false },
    { x: 370.7, y: 8, tooltip: '6 июл 2025 · 24:00 · 100%', isPeak: false, isCurrent: false },
    { x: 552, y: 112, tooltip: '3 авг 2025 · 30:00 · 80%', isPeak: false, isCurrent: true },
  ],
};

/** The same fading geometry from a far anchor: «сейчас» gives way to the stale note. */
export const EXPECTED_STALE_FORM_VIEW: FormView = { ...EXPECTED_FADING_FORM_VIEW, isStale: true };

/** The lone flat window rests in the middle of the box; its single dot is both peak and current. */
export const EXPECTED_SINGLE_WINDOW_VIEW: FormView = {
  currentPercent: 100,
  isAtPeak: true,
  isStale: false,
  peakMonthText: 'мае 2025',
  linePoints: '280,60',
  points: [{ x: 280, y: 60, tooltip: '4 май 2025 · 30:00 · 100%', isPeak: true, isCurrent: true }],
};
