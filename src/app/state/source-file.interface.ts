/** The uploaded xlsx export, kept for re-parsing and archive publication. */
export interface SourceFile {
  name: string;
  bytes: Uint8Array;
}

/**
 * An uploaded file paired with the date read from its name. Only the file import needs it: the
 * drop is ordered by that date before it becomes drafts, so the sort never has to look at a
 * draft's (nullable) source file.
 */
export interface DatedSourceFile {
  dateIso: string | null;
  file: SourceFile;
}
