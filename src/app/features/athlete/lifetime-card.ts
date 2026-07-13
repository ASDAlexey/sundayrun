import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { lifetimeAggregates } from '../../core/history/lifetime-aggregates';
import { LifetimeAggregates } from '../../core/history/lifetime-aggregates.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { LifetimeView } from './lifetime-card.interface';

/**
 * The «Цифры за всё время» card: the lifetime time on the course and the kilometres over every
 * finish (the short course included), the 5 km results histogram by whole minutes, and the mean
 * 5 km pace per year. No finishes at all hide the card.
 */
@Component({
  selector: 'app-lifetime-card',
  templateUrl: './lifetime-card.html',
  styleUrl: './lifetime-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LifetimeCard {
  /** Every finish of both distances — the totals count the short course too. */
  readonly runs = input.required<AthleteRun[]>();
  readonly view = computed(() => toLifetimeView(lifetimeAggregates(this.runs())));
}

function toLifetimeView(aggregates: LifetimeAggregates): LifetimeView | null {
  if (aggregates.totalKm === 0) {
    return null;
  }

  // The guard keeps a short-course-only history (no buckets at all) from dividing by -Infinity.
  const tallestCount = Math.max(...aggregates.minuteBuckets.map((bucket) => bucket.count), 1);

  return {
    totalTimeText: formatDuration(aggregates.totalTimeMs),
    totalKmText: String(aggregates.totalKm).replace('.', ','),
    buckets: aggregates.minuteBuckets.map((bucket) => ({
      minute: bucket.minute,
      label: `${bucket.minute}:xx`,
      count: bucket.count,
      widthPercent: Math.round((100 * bucket.count) / tallestCount),
    })),
    yearPaces: aggregates.yearPaces.map((pace) => ({ year: pace.year, paceText: formatDuration(pace.paceMsPerKm) })),
  };
}
