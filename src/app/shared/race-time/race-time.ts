import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { FRACTION_SEPARATOR } from '../../core/time/duration.constant';
import { NO_FRACTION_INDEX } from './race-time.constant';
import { RaceTimeParts } from './race-time.interface';

/**
 * A race time — '23:04,18' — with its hundredths set a step smaller and quieter than the seconds.
 *
 * Every result on the site is drawn to hundredths, and most of the archive can only ever say ',00'.
 * At one size that trailing pair shouts as loudly as the minutes and a column of results turns into
 * a wall of digits; demoted, it reads the way a stopwatch face does — the seconds first, the
 * fraction as a footnote to them.
 *
 * The value arrives already formatted (see `formatRaceTime`), so text that is not a time at all —
 * an empty cell, 'DNF' — passes through untouched.
 */
@Component({
  selector: 'app-race-time',
  templateUrl: './race-time.html',
  styleUrl: './race-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceTime {
  /** An already formatted time: 'm:ss,cc', 'h:mm:ss,cc', or any text without a fraction. */
  readonly value = input.required<string>();

  protected readonly parts = computed<RaceTimeParts>(() => {
    const value = this.value();
    const index = value.lastIndexOf(FRACTION_SEPARATOR);

    if (index === NO_FRACTION_INDEX) {
      return { clock: value, fraction: '' };
    }

    return { clock: value.slice(0, index), fraction: value.slice(index) };
  });
}
