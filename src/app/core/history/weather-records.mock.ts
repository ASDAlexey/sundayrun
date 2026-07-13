import { AthleteRun } from '../models/athlete-history.interface';
import { EventWeather } from '../weather/event-weather.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { AthleteWeatherBests, EventWeatherRow, WeatherExtremes } from './weather-records.interface';

const row = (slug: string, temperatureC: number | null, windKmh: number | null, weatherCode: number | null): EventWeatherRow => ({
  slug,
  temperatureC,
  apparentC: temperatureC,
  precipitationMm: 0,
  windKmh,
  weatherCode,
});

/**
 * Two seasons of readings: 2024 holds the all-time cold (−14°, tied by a later −14° day that must
 * NOT take the record) and the strongest wind; 2025 holds the all-time heat. A temperature-less
 * row never competes, a wind-less row still competes on temperature.
 */
export const WEATHER_ROWS_MOCK: EventWeatherRow[] = [
  row('2025-07-13', 30.6, 2.4, 0),
  row('2024-02-11', -14, 11.3, 71),
  row('2024-03-03', -14, 8, 3),
  row('2024-06-02', 26.5, 40.2, 61),
  row('2024-08-04', null, 50, 0),
  row('2025-01-05', -3.4, null, 3),
];

export const EXPECTED_ALL_TIME_EXTREMES: WeatherExtremes = {
  coldest: { slug: '2024-02-11', temperatureC: -14, windKmh: 11.3, weatherCode: 71 },
  hottest: { slug: '2025-07-13', temperatureC: 30.6, windKmh: 2.4, weatherCode: 0 },
  windiest: { slug: '2024-06-02', temperatureC: 26.5, windKmh: 40.2, weatherCode: 61 },
};

/** The 2025 season alone: its sole windy reading is missing, so `windiest` stays null. */
export const EXPECTED_2025_EXTREMES: WeatherExtremes = {
  coldest: { slug: '2025-01-05', temperatureC: -3.4, windKmh: null, weatherCode: 3 },
  hottest: { slug: '2025-07-13', temperatureC: 30.6, windKmh: 2.4, weatherCode: 0 },
  windiest: { slug: '2025-07-13', temperatureC: 30.6, windKmh: 2.4, weatherCode: 0 },
};

const run = (dateIso: string, timeMs: number, distanceKm = FIVE_KM_DISTANCE_KM): AthleteRun => ({
  dateIso,
  slug: dateIso,
  timeMs,
  distanceKm,
});

/** slug → weather for the athlete-bests scan, keyed off `WEATHER_ROWS_MOCK` plus a frost+snow day. */
export const WEATHER_BY_SLUG_MOCK: ReadonlyMap<string, EventWeather> = new Map(WEATHER_ROWS_MOCK.map((entry) => [entry.slug, entry]));

/**
 * The athlete's runs against `WEATHER_BY_SLUG_MOCK`: the −14° snow day covers frost AND snow, the
 * later equal-time heat run must not displace the earlier one, the 2.3 km run and the run without
 * stored weather never qualify.
 */
export const WEATHER_RUNS_MOCK: AthleteRun[] = [
  run('2024-02-11', 1500000),
  run('2024-06-02', 1450000),
  run('2025-07-13', 1450000),
  run('2019-09-01', 1200000, TWO_THREE_KM_DISTANCE_KM),
  run('2023-05-14', 1300000),
];

export const EXPECTED_ALL_TIME_BESTS: AthleteWeatherBests = {
  rain: { slug: '2024-06-02', timeMs: 1450000, temperatureC: 26.5 },
  snow: { slug: '2024-02-11', timeMs: 1500000, temperatureC: -14 },
  frost: { slug: '2024-02-11', timeMs: 1500000, temperatureC: -14 },
  heat: { slug: '2024-06-02', timeMs: 1450000, temperatureC: 26.5 },
};

/** The 2025 season alone: only the heat bucket survives the year cut. */
export const EXPECTED_2025_BESTS: AthleteWeatherBests = {
  rain: null,
  snow: null,
  frost: null,
  heat: { slug: '2025-07-13', timeMs: 1450000, temperatureC: 30.6 },
};
