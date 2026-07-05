/** One athlete's result at the event being processed, against which the auto note is computed. */
export interface AutoNoteInput {
  key: string;
  timeMs: number | null;
  distanceKm: number;
  dateIso: string;
}
