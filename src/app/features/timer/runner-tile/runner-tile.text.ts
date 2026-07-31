/**
 * «Убрать Ширшова Дениса из состава» — the name is in the label because a grid of thirty «×» keys
 * is thirty identical labels to a screen reader, and the one thing that has to be certain before
 * this key is pressed is whom it is about.
 */
export function tileRemoveLabelText(fullName: string): string {
  return $localize`:@@timerTile.removeLabel:Убрать ${fullName}:name: из состава`;
}
