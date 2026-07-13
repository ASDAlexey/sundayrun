/** One histogram row: a whole minute of 5 km results and its bar. */
export interface BucketView {
  /** The whole minute: 24 collects every 24:00–24:59 finish. */
  minute: number;
  /** «24:xx» — the row label. */
  label: string;
  count: number;
  /** The bar length against the tallest bucket, 0–100. */
  widthPercent: number;
}

/** One year's mean 5 km pace prepared for the template. */
export interface YearPaceView {
  year: string;
  /** «4:58» — the mean pace per kilometre; the template appends «/км». */
  paceText: string;
}

/** The «Цифры за всё время» card prepared for the template; null (no finishes) hides the card. */
export interface LifetimeView {
  /** «1:26:30» — every finish of both distances summed. */
  totalTimeText: string;
  /** «17,3» — lifetime kilometres with the decimal comma. */
  totalKmText: string;
  /** The 5 km minute histogram; empty (no 5 km finishes) hides the block. */
  buckets: BucketView[];
  /** The mean 5 km pace per year, oldest first; empty hides the block. */
  yearPaces: YearPaceView[];
}
