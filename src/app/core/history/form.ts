import { AthleteRun } from '../models/athlete-history.interface';
import { MS_IN_DAY } from './badge-signals.constant';
import { FORM_WINDOW_SIZE, PEAK_PERCENT } from './form.constant';
import { AthleteForm, FormPoint } from './form.interface';
import { medianMs } from './median';
import { FORM_STALE_DAYS } from './runner-scores.constant';

/**
 * «Форма»: the rolling median of the last FORM_WINDOW_SIZE 5 km finishes, measured against the
 * athlete's best-ever window — the peak. The latest window is «сейчас — 94% от пика»; the earliest
 * window reaching the lowest median is the peak, so a later equally-good patch never moves
 * «лучшая форма была в мае 2025». Fewer finishes than one full window make no form at all.
 *
 * `anchorIso` is the archive's newest event day. A newest finish older than FORM_STALE_DAYS from it
 * marks the form stale — the same season-long break that empties «Индекс формы».
 */
export function athleteForm(runs: AthleteRun[], anchorIso: string): AthleteForm | null {
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
  const current = points[points.length - 1];
  const isStale = (Date.parse(anchorIso) - Date.parse(current.dateIso)) / MS_IN_DAY > FORM_STALE_DAYS;

  return { points, peak, current, isStale };
}
