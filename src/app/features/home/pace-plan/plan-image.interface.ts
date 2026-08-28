/** What it takes to turn a poster into a file the visitor keeps. */
export interface PlanImageRequest {
  /** The poster as an SVG document. */
  readonly svg: string;

  readonly fileName: string;

  /** Injected rather than reached for: this runs under an Angular app that may be server-rendered,
   * and the global `document` is not the one it should be drawing into. */
  readonly document: Document;
}
