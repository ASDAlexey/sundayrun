import { pluralText } from '../../../core/i18n/plural-text';
import { formatRaceTime } from '../../../core/time/duration';

/** «15 финишировали» — the middle of the farewell line. */
export function finishedCountText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timer.finishedOne:${count}:count: финишировал`,
    few: $localize`:@@timer.finishedFew:${count}:count: финишировали`,
    many: $localize`:@@timer.finishedMany:${count}:count: финишировали`,
  });
}

/** «19:24 лучший» — the tail of the same line. */
export function bestFinishText(ms: number): string {
  return $localize`:@@timer.bestFinish:${formatRaceTime(ms)}:time: лучший`;
}
