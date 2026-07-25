/** One line of the live «Первый круг» table — a runner, or a time that is still waiting for a name. */
export interface LapBoardRow {
  position: number;
  /** The journal entry the line stands for: the only stable key a nameless line has. */
  splitId: string;
  /** `null` until the time is handed out — the place is held, the surname comes later. */
  runnerId: string | null;
  fullName: string | null;
  lapMs: number;
  gapMs: number;
}
