import { pluralText } from '../../../core/i18n/plural-text';

/** «1 участник / 2 участника / 15 участников» — each plural form is a separate message. */
export function runnerCountText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timerList.runnersOne:${count}:count: участник`,
    few: $localize`:@@timerList.runnersFew:${count}:count: участника`,
    many: $localize`:@@timerList.runnersMany:${count}:count: участников`,
  });
}

/** «1 отсечка / 2 отсечки / 30 отсечек» — each plural form is a separate message. */
export function splitCountText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timerList.splitsOne:${count}:count: отсечка`,
    few: $localize`:@@timerList.splitsFew:${count}:count: отсечки`,
    many: $localize`:@@timerList.splitsMany:${count}:count: отсечек`,
  });
}

/** «2 без имени» — the tail of the meta line, shown only while something is still waiting for a name. */
export function unnamedCountText(count: number): string {
  return $localize`:@@timerList.unnamed:${count}:count: без имени`;
}

/** «Забег 26 июля 2026 г.: 7 участников · 11 отсечек. Восстановить его будет нельзя.» */
export function removeSessionNoteText(dateText: string, metaText: string): string {
  return $localize`:@@timerList.removeNote:Забег ${dateText}:date:: ${metaText}:meta:. Восстановить его будет нельзя.`;
}
