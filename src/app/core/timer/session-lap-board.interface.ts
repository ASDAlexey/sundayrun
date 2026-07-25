/** One line of the live «Первый круг» table. */
export interface LapBoardRow {
  position: number;
  runnerId: string;
  fullName: string;
  lapMs: number;
  gapMs: number;
}
