/**
 * «Запись 3 — 27:35, Кузнецов Пётр» — the question names the row it is about, because in a journal
 * of thirty taps the position in the list is the only thing telling two identical times apart.
 */
export function historyRemoveNoteText(index: number, timeText: string, ownerName: string | null): string {
  const owner = ownerName ?? $localize`:@@timerHistory.removeNobody:без имени`;

  return $localize`:@@timerHistory.removeNote:Запись ${index}:index: — ${timeText}:time:, ${owner}:owner:. Журнал — первоисточник: вернуть строку будет нельзя.`;
}

/**
 * «Карточка: Ширшов Денис» — a column of identically labelled keys tells a screen reader nothing,
 * and this one opens a card that can swap two runners' times, so it has to say whose it is. Built
 * here rather than interpolated into `i18n-aria-label`: the tile's «×» sets its label the same way.
 */
export function historyCardLabelText(fullName: string): string {
  return $localize`:@@timerHistory.cardLabel:Карточка: ${fullName}:name:`;
}
