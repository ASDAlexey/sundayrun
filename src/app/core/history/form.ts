import { AthleteRun } from '../models/athlete-history.interface';
import { FORM_WINDOW_SIZE, PEAK_PERCENT } from './form.constant';
import { AthleteForm, FormPoint } from './form.interface';
import { medianMs } from './median';

/**
 * «Форма»: the rolling median of the last FORM_WINDOW_SIZE 5 km finishes, measured against the
 * athlete's best-ever window — the peak. The latest window is «сейчас — 94% от пика»; the earliest
 * window reaching the lowest median is the peak, so a later equally-good patch never moves
 * «лучшая форма была в мае 2025». Fewer finishes than one full window make no form at all.
 */
export function athleteForm(runs: AthleteRun[]): AthleteForm | null {
  if (runs.length < FORM_WINDOW_SIZE) {
    return null;
  }

  const chronological = [...runs].sort((left, right) => left.dateIso.localeCompare(right.dateIso));
  const windows = chronological.slice(FORM_WINDOW_SIZE - 1).map((run, index) => ({
    dateIso: run.dateIso,
    medianMs: medianMs(chronological.slice(index, index + FORM_WINDOW_SIZE).map((windowRun) => windowRun.timeMs)),
  }));
  const peakMedianMs = Math.min(...windows.map((window) => window.medianMs));
  const points: FormPoint[] = windows.map((window) => ({
    ...window,
    percent: Math.round((PEAK_PERCENT * peakMedianMs) / window.medianMs),
  }));
  const peak = points.reduce((best, point) => (point.medianMs < best.medianMs ? point : best));

  return { points, peak, current: points[points.length - 1] };
}
