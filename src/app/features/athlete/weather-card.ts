import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { athleteWeatherBests } from '../../core/history/weather-records';
import { AthleteWeatherBest, EventWeatherRow } from '../../core/history/weather-records.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { temperatureText } from '../../core/weather/temperature-text';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { WEATHER_BUCKETS } from './weather-card.constant';
import { WeatherBestView } from './weather-card.interface';

/**
 * The «Погодные рекорды» card: the athlete's fastest 5 km in rain, snow, frost and heat, by the
 * stored 9:00 course readings; the year filter rescans one season. Buckets without a qualifying
 * run hide their row, and a history with no weathered run at all hides the card entirely.
 */
@Component({
  selector: 'app-weather-card',
  imports: [RouterLink],
  templateUrl: './weather-card.html',
  styleUrl: './weather-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherCard {
  // The lambda runs lazily, so referencing the inputs declared below is safe.
  readonly #weatherBySlug = computed(() => new Map(this.weather().map((row) => [row.slug, row])));

  /** The athlete's full history; the card cuts to 5 km finishes itself. */
  readonly runs = input.required<AthleteRun[]>();
  /** Every event's stored weather; runs of weather-less events never qualify. */
  readonly weather = input.required<EventWeatherRow[]>();
  /** 'YYYY' narrows the scan to one season; null means all time. */
  readonly year = input.required<string | null>();

  readonly rows = computed(() => toBestViews(this.runs(), this.#weatherBySlug(), this.year()));
}

function toBestViews(runs: AthleteRun[], weatherBySlug: ReadonlyMap<string, EventWeatherRow>, year: string | null): WeatherBestView[] {
  const bests = athleteWeatherBests(runs, weatherBySlug, year);

  return WEATHER_BUCKETS.flatMap((bucket) => {
    const best = bests[bucket.key];

    return best === null ? [] : [toBestView(bucket.key, bucket.icon, bucket.label, best)];
  });
}

function toBestView(key: string, icon: string, label: string, best: AthleteWeatherBest): WeatherBestView {
  return {
    key,
    icon,
    label,
    timeText: formatDuration(best.timeMs),
    temperatureText: best.temperatureC === null ? '' : temperatureText(best.temperatureC),
    dateShort: formatRussianDateShort(best.slug),
    raceLink: [RACE_PAGE_BASE_LINK, best.slug],
  };
}
