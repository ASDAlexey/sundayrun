/**
 * «Убрать Троилина из забега?» — the card names the runner and what goes with him, because a tile
 * removed by mistake takes both of his times along and there is no undo for that.
 */
export function cardRemoveNoteText(fullName: string, timesText: string): string {
  return $localize`:@@timer.cardRemoveNote:${fullName}:name: уходит из состава вместе со своими временами (${timesText}:times:). Вернуть их будет нельзя — только записать заново.`;
}
