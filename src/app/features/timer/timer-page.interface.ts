/** Everything the top bar and the filter strip show about the open measurement. */
export interface TimerHeaderView {
  /** «вс · 26 июл 2026» — instrument marking, mono and spaced out. */
  dateText: string;
  finishCount: number;
  lapCount: number;
  runnerCount: number;
  /** There is a journal entry the header's «Отменить» can drop. */
  undoArmed: boolean;
}
