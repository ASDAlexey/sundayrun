/** The uploaded xlsx export, kept for re-parsing and archive publication. */
export interface SourceFile {
  name: string;
  bytes: Uint8Array;
}
