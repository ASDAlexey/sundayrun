/** `data/version.json` — the tiny pointer every visitor revalidates to pin data urls to the latest commit. */
export interface VersionFile {
  schemaVersion: 1;
  /** Full sha of the data commit all published reads should be pinned to. */
  sha: string;
}
