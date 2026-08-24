import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { athleteWeatherBests } from '../../core/history/weather-records';
import { type AthleteWeatherBest, type EventWeatherRow } from '../../core/history/weather-records.interface';
import { type AthleteRun } from '../../core/models/athlete-history.interface';
import { formatRaceTime } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { temperatureText } from '../../core/weather/temperature-text';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { WEATHER_BUCKETS } from './weather-card.constant';
import { type WeatherBestView } from './weather-card.interface';
import { RaceTime } from '../../shared/race-time/race-time';

/**
 * The «Погодные рекорды» card: the athlete's fastest 5 km in rain, snow, frost and heat, by the
 * stored 9:00 course readings; the year filter rescans one season. Buckets without a qualifying
 * run hide their row, and a history with no weathered run at all hides the card entirely.
 */
@Component({
  selector: 'app-weather-card',
  imports: [RouterLink, RaceTime],
  templateUrl: './weather-card.html',
  styleUrl: './weather-card.scss',
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

  readonly rows = computed(() => toBestViews(this.runs(), { weatherBySlug: this.#weatherBySlug(), year: this.year() }));
}

function toBestViews(
  runs: AthleteRun[],
  { weatherBySlug, year }: { weatherBySlug: ReadonlyMap<string, EventWeatherRow>; year: string | null },
): WeatherBestView[] {
  const bests = athleteWeatherBests(runs, { weatherBySlug, year });

  return WEATHER_BUCKETS.flatMap((bucket) => {
    const best = bests[bucket.key];

    return best === null ? [] : [toBestView(bucket.key, { icon: bucket.icon, label: bucket.label, best })];
  });
}

function toBestView(key: string, { icon, label, best }: { icon: string; label: string; best: AthleteWeatherBest }): WeatherBestView {
  return {
    key,
    icon,
    label,
    timeText: formatRaceTime(best.timeMs),
    temperatureText: best.temperatureC === null ? '' : temperatureText(best.temperatureC),
    dateShort: formatRussianDateShort(best.slug),
    raceLink: [RACE_PAGE_BASE_LINK, best.slug],
  };
}
