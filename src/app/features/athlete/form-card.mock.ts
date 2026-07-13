import { IMPROVING_FORM_RUNS } from '../../core/history/form.mock';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { FormView } from './form-card.interface';

/** Exactly one full window: five equal runs ending in May — the athlete is at the peak by definition. */
export const SINGLE_WINDOW_RUNS: readonly AthleteRun[] = IMPROVING_FORM_RUNS.slice(0, 5);

/** FADING_FORM_RUNS mapped into the 560×120 viewBox: three peak windows on top, the fade dropping to the floor. */
export const EXPECTED_FADING_FORM_VIEW: FormView = {
  currentPercent: 80,
  isAtPeak: false,
  peakMonthText: 'мае 2025',
  linePoints: '8,8 189.3,8 370.7,8 552,112',
  peakDot: { x: 8, y: 8 },
  currentDot: { x: 552, y: 112 },
};

/** The lone flat window rests in the middle of the box; both dots share it. */
export const EXPECTED_SINGLE_WINDOW_VIEW: FormView = {
  currentPercent: 100,
  isAtPeak: true,
  peakMonthText: 'мае 2025',
  linePoints: '280,60',
  peakDot: { x: 280, y: 60 },
  currentDot: { x: 280, y: 60 },
};
