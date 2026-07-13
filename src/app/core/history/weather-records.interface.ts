import { EventWeather } from '../weather/event-weather.interface';

/** One event's stored weather keyed by its slug — the whole `event_weather` table read at once. */
export interface EventWeatherRow extends EventWeather {
  slug: string;
}

/** One extreme-weather event: where the record temperature (or wind) was measured. */
export interface WeatherExtreme {
  slug: string;
  temperatureC: number;
  windKmh: number | null;
  weatherCode: number | null;
}

/** The wind record: a `WeatherExtreme` that, being the windiest, always carries a wind reading. */
export interface WindiestExtreme extends WeatherExtreme {
  windKmh: number;
}

/** The course-wide weather extremes of one season (or all time); null while nothing qualifies. */
export interface WeatherExtremes {
  coldest: WeatherExtreme;
  hottest: WeatherExtreme;
  windiest: WindiestExtreme | null;
}

/** The athlete's fastest 5 km run inside one weather bucket, with the conditions it was run in. */
export interface AthleteWeatherBest {
  slug: string;
  timeMs: number;
  temperatureC: number | null;
}

/** The athlete's per-weather personal bests; a bucket without a qualifying run stays null. */
export interface AthleteWeatherBests {
  rain: AthleteWeatherBest | null;
  snow: AthleteWeatherBest | null;
  frost: AthleteWeatherBest | null;
  heat: AthleteWeatherBest | null;
}
