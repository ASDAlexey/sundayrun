/** Where the browser reads the SQLite archive from. */
export const DbSource = {
  /** The dev server serving `data/sundayrun.db` off disk — localhost only. */
  Local: 'local',
  /** The sha-pinned public file on the jsDelivr CDN. */
  JsDelivr: 'jsdelivr',
} as const;

export type DbSourceType = (typeof DbSource)[keyof typeof DbSource];
