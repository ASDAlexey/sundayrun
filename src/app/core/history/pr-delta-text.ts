import { formatRaceTime } from '../time/duration';
import { formatRussianDateCompact } from '../time/russian-date';
import { isoYear } from './iso-year';
import { PR_DELTA_HINT_SEPARATOR } from './pr-delta.constant';
import { PreviousBest } from './previous-bests.interface';

/**
 * The hint behind a «Δ ЛР» figure — «ЛР 19:46,00 · 12 янв 2025 · лучшее в 2026 — 20:05,00».
 *
 * The column can only hold one number, and the number it holds is the all-time one; the season a
 * reader actually remembers lives here instead, one hover (or one tap) away. The year clause is
 * dropped when the record itself was set that year — repeating the same run twice explains nothing.
 * Empty for a row with no record behind it, which shows no figure either.
 */
export function prDeltaHint(previousBest: PreviousBest | undefined, yearBest: PreviousBest | undefined): string {
  if (previousBest === undefined) {
    return '';
  }

  const recordText = $localize`:@@prDelta.hintRecord:ЛР ${formatRaceTime(previousBest.timeMs)}:time: · ${formatRussianDateCompact(previousBest.dateIso)}:date:`;

  if (yearBest === undefined || yearBest.slug === previousBest.slug) {
    return recordText;
  }

  const yearText = $localize`:@@prDelta.hintYear:лучшее в ${isoYear(yearBest.dateIso)}:year: — ${formatRaceTime(yearBest.timeMs)}:time:`;

  return recordText + PR_DELTA_HINT_SEPARATOR + yearText;
}

/**
 * The hint behind the season figure — «Лучшее в 2026 — 20:05,00 · 12 апр 2026».
 *
 * The same two facts as the record hint, one window narrower: a reader who set the column to the
 * season is asking about this year and gets this year's best dated, not the career's.
 */
export function yearBestHint(yearBest: PreviousBest | undefined): string {
  if (yearBest === undefined) {
    return '';
  }

  const bestText = $localize`:@@prDelta.hintYearBest:Лучшее в ${isoYear(yearBest.dateIso)}:year: — ${formatRaceTime(yearBest.timeMs)}:time:`;

  return bestText + PR_DELTA_HINT_SEPARATOR + formatRussianDateCompact(yearBest.dateIso);
}
