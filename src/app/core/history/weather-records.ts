import { AthleteRun } from '../models/athlete-history.interface';
import { EventWeather } from '../weather/event-weather.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { FROST_MAX_TEMPERATURE_C, HEAT_MIN_TEMPERATURE_C, RAIN_WEATHER_CODES, SNOW_WEATHER_CODES } from './weather-records.constant';
import {
  AthleteWeatherBest,
  AthleteWeatherBests,
  EventWeatherRow,
  WeatherExtreme,
  WeatherExtremes,
  WindiestExtreme,
} from './weather-records.interface';

/**
 * The coldest, hottest and windiest events of one season (`year` = 'YYYY') or of all time
 * (`year` = null), by the stored 9:00 readings. Site convention holds here too: on equal readings
 * the earlier event keeps the record. Null while no event of the scope stores a temperature;
 * `windiest` alone stays null while no scoped event stores wind.
 */
export function weatherExtremes(rows: EventWeatherRow[], year: string | null): WeatherExtremes | null {
  const scoped = rows
    .flatMap<WeatherExtreme>((row) =>
      row.temperatureC === null || (year !== null && isoYear(row.slug) !== year)
        ? []
        : [{ slug: row.slug, temperatureC: row.temperatureC, windKmh: row.windKmh, weatherCode: row.weatherCode }],
    )
    .sort((left, right) => left.slug.localeCompare(right.slug));

  let coldest: WeatherExtreme | null = null;
  let hottest: WeatherExtreme | null = null;
  let windiest: WindiestExtreme | null = null;
  let windiestWind = Number.NEGATIVE_INFINITY;

  for (const row of scoped) {
    if (coldest === null || row.temperatureC < coldest.temperatureC) {
      coldest = row;
    }

    if (hottest === null || row.temperatureC > hottest.temperatureC) {
      hottest = row;
    }

    if (row.windKmh !== null && row.windKmh > windiestWind) {
      windiest = { ...row, windKmh: row.windKmh };
      windiestWind = row.windKmh;
    }
  }

  if (coldest === null || hottest === null) {
    return null;
  }

  return { coldest, hottest, windiest };
}

/**
 * The athlete's fastest 5 km finish in each weather bucket — rain and snow by the WMO code,
 * frost and heat by the start-hour temperature — within one season or all time. On equal times
 * the earlier run keeps the best. Runs of events without stored weather never qualify.
 */
export function athleteWeatherBests(
  runs: AthleteRun[],
  weatherBySlug: ReadonlyMap<string, EventWeather>,
  year: string | null,
): AthleteWeatherBests {
  const bests: AthleteWeatherBests = { rain: null, snow: null, frost: null, heat: null };
  const scoped = runs
    .filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM && (year === null || isoYear(run.dateIso) === year))
    .sort((left, right) => left.dateIso.localeCompare(right.dateIso));

  for (const run of scoped) {
    const weather = weatherBySlug.get(run.slug);

    if (weather === undefined) {
      continue;
    }

    if (weather.weatherCode !== null && RAIN_WEATHER_CODES.has(weather.weatherCode)) {
      bests.rain = fasterOf(bests.rain, run, weather);
    }

    if (weather.weatherCode !== null && SNOW_WEATHER_CODES.has(weather.weatherCode)) {
      bests.snow = fasterOf(bests.snow, run, weather);
    }

    if (weather.temperatureC !== null && weather.temperatureC <= FROST_MAX_TEMPERATURE_C) {
      bests.frost = fasterOf(bests.frost, run, weather);
    }

    if (weather.temperatureC !== null && weather.temperatureC >= HEAT_MIN_TEMPERATURE_C) {
      bests.heat = fasterOf(bests.heat, run, weather);
    }
  }

  return bests;
}

/** Runs arrive date-ascending, so a strict comparison keeps the earlier run on equal times. */
function fasterOf(current: AthleteWeatherBest | null, run: AthleteRun, weather: EventWeather): AthleteWeatherBest {
  if (current !== null && current.timeMs <= run.timeMs) {
    return current;
  }

  return { slug: run.slug, timeMs: run.timeMs, temperatureC: weather.temperatureC };
}
