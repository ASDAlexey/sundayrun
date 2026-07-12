/** The live countdown broken into whole units, each zero-padded to two digits for the hero card. */
export interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

/** The "next start" hero card prepared for the template — a localized date plus the live countdown. */
export interface NextStartView {
  dateLabel: string;
  startTime: string;
  countdown: CountdownParts;
}
