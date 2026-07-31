/** A formatted race time cut in two, so the hundredths can be drawn quieter than the seconds. */
export interface RaceTimeParts {
  /** 'm:ss' / 'h:mm:ss' — or the whole text when it carries no fraction ('DNF', an empty cell). */
  clock: string;
  /** The separator and the two digits after it, ',06'; empty when there is no fraction. */
  fraction: string;
}
