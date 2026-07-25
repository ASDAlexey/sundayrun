/**
 * «Запись 3 — 27:35, Кузнецов Пётр» — the question names the row it is about, because in a journal
 * of thirty taps the position in the list is the only thing telling two identical times apart.
 */
export function historyRemoveNoteText(index: number, timeText: string, ownerName: string | null): string {
  const owner = ownerName ?? $localize`:@@timerHistory.removeNobody:без имени`;

  return $localize`:@@timerHistory.removeNote:Запись ${index}:index: — ${timeText}:time:, ${owner}:owner:. Журнал — первоисточник: вернуть строку будет нельзя.`;
}
