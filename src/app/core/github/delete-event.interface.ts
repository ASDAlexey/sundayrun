/**
 * The outcome of a deletion: the data commit sha, plus whether the version pointer was published.
 * The data commit is the source of truth — once it lands the event is gone — so a pointer that
 * could not commit yet leaves `pointerPublished: false` rather than failing the whole deletion.
 */
export interface DeleteEventResult {
  commitSha: string;
  pointerPublished: boolean;
}
