/** One run of a value: either a time, cut at its hundredths, or the plain text between two times. */
export interface RaceTimeSegment {
  /** The clock of a time run — 'm:ss' / 'h:mm:ss' — or the words of a plain run, as they came. */
  text: string;
  /** ',cc' on a time run; empty on a plain one, which is what tells the two apart. */
  fraction: string;
}
