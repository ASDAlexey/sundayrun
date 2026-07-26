/** A date found in a file name; `year` is null when the name carries none and it has to be inferred. */
export interface FileNameDateMatch {
  day: number;
  month: number;
  year: number | null;
}
