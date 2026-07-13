import { EventWeather } from './event-weather.interface';
import {
  MS_PER_DAY,
  RACE_START_HOUR,
  WEATHER_ARCHIVE_API_URL,
  WEATHER_ARCHIVE_LAG_DAYS,
  WEATHER_FORECAST_API_URL,
  WEATHER_HOURLY_PARAMS,
  WEATHER_LATITUDE,
  WEATHER_LONGITUDE,
  WEATHER_TIMEZONE,
} from './weather-api.constant';
import { WeatherFetchFn } from './weather-fetch.type';

/** Default fetch for production use; wraps the global fetch to keep its `this` binding intact. */
const DEFAULT_WEATHER_FETCH: WeatherFetchFn = (url) => fetch(url);

/** The hourly arrays of an Open-Meteo response, index-aligned with `time`. */
interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: (number | null)[];
  apparent_temperature?: (number | null)[];
  precipitation?: (number | null)[];
  wind_speed_10m?: (number | null)[];
  weather_code?: (number | null)[];
}

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
}

/**
 * The 9:00 course weather of one event date from Open-Meteo (free, keyless). Dates older than the
 * reanalysis lag come from the archive endpoint, fresher ones — publication day included — from the
 * forecast endpoint's past hours. Weather is garnish: any network, HTTP or shape failure resolves
 * to null so the caller can proceed without it.
 */
export async function fetchEventWeather(
  dateIso: string,
  todayIso: string,
  fetchFn: WeatherFetchFn = DEFAULT_WEATHER_FETCH,
): Promise<EventWeather | null> {
  try {
    const response = await fetchFn(weatherRequestUrl(dateIso, todayIso));

    if (!response.ok) {
      return null;
    }

    const body: OpenMeteoResponse = await response.json();

    return extractStartHour(body.hourly, dateIso);
  } catch {
    return null;
  }
}

/** One-day hourly request for the event date, against the endpoint that actually has the date. */
export function weatherRequestUrl(dateIso: string, todayIso: string): string {
  const ageDays = (Date.parse(todayIso) - Date.parse(dateIso)) / MS_PER_DAY;
  const baseUrl = ageDays >= WEATHER_ARCHIVE_LAG_DAYS ? WEATHER_ARCHIVE_API_URL : WEATHER_FORECAST_API_URL;
  const params = new URLSearchParams({
    latitude: String(WEATHER_LATITUDE),
    longitude: String(WEATHER_LONGITUDE),
    start_date: dateIso,
    end_date: dateIso,
    hourly: WEATHER_HOURLY_PARAMS,
    timezone: WEATHER_TIMEZONE,
  });

  return `${baseUrl}?${params}`;
}

/** The race-start-hour readings; a response without that hour (or without a temperature) is no weather at all. */
function extractStartHour(hourly: OpenMeteoHourly | undefined, dateIso: string): EventWeather | null {
  const index = hourly?.time?.indexOf(`${dateIso}T${RACE_START_HOUR}`) ?? -1;

  if (index === -1) {
    return null;
  }

  const weather: EventWeather = {
    temperatureC: hourly?.temperature_2m?.[index] ?? null,
    apparentC: hourly?.apparent_temperature?.[index] ?? null,
    precipitationMm: hourly?.precipitation?.[index] ?? null,
    windKmh: hourly?.wind_speed_10m?.[index] ?? null,
    weatherCode: hourly?.weather_code?.[index] ?? null,
  };

  return weather.temperatureC === null ? null : weather;
}
