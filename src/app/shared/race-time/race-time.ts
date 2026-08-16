import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

import { RACE_TIME_FRACTION_PATTERN } from '../../core/time/duration.constant';
import { RACE_TIME_START_INDEX } from './race-time.constant';
import { RaceTimeSegment } from './race-time.interface';

/**
 * A race time — '23:04,18' — with its hundredths set a step smaller and quieter than the seconds.
 *
 * Every result on the site is drawn to hundredths, and most of the archive can only ever say ',00'.
 * At one size that trailing pair shouts as loudly as the minutes and a column of results turns into
 * a wall of digits; demoted, it reads the way a stopwatch face does — the seconds first, the
 * fraction as a footnote to them. A reader who wants none of it switches the fraction off in the
 * header («Настройки», see `HundredthsService`) — that hides the fraction runs through a class on
 * `<html>`, so the markup is the same either way and hydration meets what the prerender wrote.
 *
 * The value arrives already formatted (see `formatRaceTime`), so text that is not a time at all —
 * an empty cell, 'DNF' — passes through untouched, and a whole sentence with times inside it
 * («ЛР (было 23:05,00)», '23:05,00 → 22:50,00') has every fraction in it picked out.
 */
@Component({
  selector: 'app-race-time',
  templateUrl: './race-time.html',
  styleUrl: './race-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceTime {
  /** Already formatted text: 'm:ss,cc', 'h:mm:ss,cc', a sentence carrying one, or no time at all. */
  readonly value = input.required<string>();

  /**
   * Holds the fraction on even where the reader switched hundredths off. Two places measure rather
   * than report: the stopwatch cockpit, whose whole job is the hundredth it just caught, and the
   * organiser's preview, which is a check of the protocol about to be published. Hiding digits
   * there would not be a preference — it would be a lie about what was recorded.
   */
  readonly pinnedFraction = input(false, { transform: booleanAttribute });

  protected readonly parts = computed<RaceTimeSegment[]>(() => splitFractions(this.value()));
}

/**
 * Cuts the value into runs: every clock with its hundredths becomes one, the words between them
 * another. A time is then a single element, so it never breaks across lines, while a note long
 * enough to wrap («ЛР (было 23:05,00)» in a narrow cell) still wraps between its words.
 */
function splitFractions(value: string): RaceTimeSegment[] {
  const segments: RaceTimeSegment[] = [];
  let cursor = RACE_TIME_START_INDEX;

  for (const match of value.matchAll(RACE_TIME_FRACTION_PATTERN)) {
    const clock = match[1];
    const fraction = match[2];

    if (match.index > cursor) {
      segments.push({ text: value.slice(cursor, match.index), fraction: '' });
    }

    segments.push({ text: clock, fraction });
    cursor = match.index + clock.length + fraction.length;
  }

  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), fraction: '' });
  }

  return segments;
}
