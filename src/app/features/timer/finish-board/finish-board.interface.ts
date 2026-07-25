/** One protocol line as the «Финиш» tab shows it — the same strings the site will publish. */
export interface TimerFinishRow {
  fullName: string;
  index: number;
  /** A DNF or a 2.3 km runner: no 5 km time, and the row is dimmed. */
  out: boolean;
  paceText: string;
  /** The gendered place, or empty when the row has none. */
  placeText: string;
  time23: string;
  time5: string;
}
