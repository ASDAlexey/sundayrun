import { formatRaceTime } from '../time/duration';
import { pluralText } from '../i18n/plural-text';
import { FormDeltaKind } from './form-delta.enum';
import { FormBaseline, FormDelta } from './form-delta.interface';

/**
 * What the «Δ форма» cell reads: the signed figure, or the words that replace it after a break.
 *
 * The comeback row is the one place the column stops counting. It has a figure — the arithmetic
 * never fails — but printing «+3:20» against the shape someone was in before three months away
 * states a fact while implying a verdict, and the protocol has no business implying it.
 */
export function formDeltaText(delta: FormDelta): string {
  if (delta.kind === FormDeltaKind.afterBreak) {
    return $localize`:@@formDelta.afterBreak:После перерыва`;
  }

  return delta.text;
}

/**
 * The hint behind the figure — «Обычно 20:41,00 — по 5 последним забегам».
 *
 * The column shows a difference, and a difference is unreadable without the thing it was taken
 * from; the baseline is named here rather than in a legend nobody scrolls to. A one-run baseline
 * says so plainly instead of dressing a single result up as a median, and the comeback row names
 * the break that stopped the count.
 */
export function formDeltaHint(baseline: FormBaseline, delta: FormDelta): string {
  if (delta.kind === FormDeltaKind.afterBreak) {
    const daysText = pluralText(delta.restDays, {
      one: $localize`:@@formDelta.breakDayOne:день`,
      few: $localize`:@@formDelta.breakDayFew:дня`,
      many: $localize`:@@formDelta.breakDayMany:дней`,
    });

    return $localize`:@@formDelta.hintBreak:Перерыв ${delta.restDays}:days: ${daysText}:daysText: — прежняя форма уже не мерка`;
  }

  const usualText = formatRaceTime(baseline.medianMs);

  if (baseline.runCount === 1) {
    return $localize`:@@formDelta.hintSingle:Прошлый забег — ${usualText}:time:`;
  }

  return $localize`:@@formDelta.hintMedian:Обычно ${usualText}:time: — по ${baseline.runCount}:count: последним забегам`;
}
