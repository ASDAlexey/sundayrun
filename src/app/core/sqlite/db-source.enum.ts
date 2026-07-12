/** Where the browser reads the SQLite archive from — always same-origin. */
export const DbSource = {
  /** The dev server serving `data/sundayrun.db` off disk — localhost only. */
  Local: 'local',
  /** The copy bundled into the GitHub Pages deploy, read relative to the base href. */
  Pages: 'pages',
} as const;

export type DbSourceType = (typeof DbSource)[keyof typeof DbSource];
