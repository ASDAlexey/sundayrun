/** One line of the table under the poster's map. */
export interface PosterRow {
  readonly label: string;

  readonly time: string;

  /** Lap crossings are drawn the way the map draws them — as officials, not as measurements. */
  readonly lap: boolean;
}

/**
 * The colours the poster is drawn in, read off the live page so a saved picture matches the site
 * the visitor is looking at, dark theme included.
 */
export interface PosterPalette {
  readonly paper: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly route: string;
  readonly routeCasing: string;
  readonly mark: string;
  readonly accent: string;
  readonly border: string;
}

/** Everything the poster prints. Assembled by the card; the builder invents nothing. */
export interface PosterInput {
  readonly title: string;

  readonly finishText: string;

  readonly paceText: string;

  readonly rows: readonly PosterRow[];

  /** Target time at each point of the course, keyed by metres — the same map the page is given. */
  readonly splits: ReadonlyMap<number, string>;

  readonly footer: string;

  readonly palette: PosterPalette;
}
