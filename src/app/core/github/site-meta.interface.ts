/** Site-wide meta the organiser edits: the start time shown in the home page «Следующий старт» block. */
export interface SiteMetaFile {
  schemaVersion: 1;
  /** `HH:MM` start time; empty string when not set. */
  startTime: string;
}
