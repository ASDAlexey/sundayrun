/** Site-wide announcement the organiser edits: the start time and the message shown on the home page. */
export interface SiteMetaFile {
  schemaVersion: 1;
  /** `HH:MM` start time; empty string when not set. */
  startTime: string;
  /** Free-form announcement text; empty string when not set. */
  announcement: string;
}
