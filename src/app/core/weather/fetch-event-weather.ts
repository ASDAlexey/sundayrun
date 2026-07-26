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
  const [weather] = await fetchEventsWeather([dateIso], todayIso, fetchFn);

  return weather;
}

/**
 * The batch form, in the input's order. A multi-protocol publication used to fire one request per
 * date at once and Open-Meteo answered the tail of the burst with 429, publishing those events
 * without weather. Instead the dates are covered by ONE request per endpoint — a single date range
 * whose hourly rows every event then reads its 9:00 from — so a batch of any size costs at most two
 * requests, sent one after the other.
 */
export async function fetchEventsWeather(dateIsos: string[], todayIso: string, fetchFn: WeatherFetchFn): Promise<(EventWeather | null)[]> {
  const weatherByDate = new Map<string, EventWeather | null>();

  for (const [baseUrl, dates] of groupDatesByEndpoint(dateIsos, todayIso)) {
    const hourly = await fetchHourly(baseUrl, dates, fetchFn);

    for (const dateIso of dates) {
      weatherByDate.set(dateIso, extractStartHour(hourly, dateIso));
    }
  }

  return dateIsos.map((dateIso) => weatherByDate.get(dateIso) ?? null);
}

/** One-day hourly request for the event date, against the endpoint that actually has the date. */
export function weatherRequestUrl(dateIso: string, todayIso: string): string {
  return hourlyRangeUrl(endpointForDate(dateIso, todayIso), dateIso, dateIso);
}

/** Dates split by the endpoint that serves them, each group keeping the order it arrived in. */
function groupDatesByEndpoint(dateIsos: string[], todayIso: string): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const dateIso of dateIsos) {
    const baseUrl = endpointForDate(dateIso, todayIso);
    const group = groups.get(baseUrl);

    if (group === undefined) {
      groups.set(baseUrl, [dateIso]);
    } else {
      group.push(dateIso);
    }
  }

  return groups;
}

/** ERA5 only reaches back-dated events; anything younger than the lag lives on the forecast endpoint. */
function endpointForDate(dateIso: string, todayIso: string): string {
  const ageDays = (Date.parse(todayIso) - Date.parse(dateIso)) / MS_PER_DAY;

  return ageDays >= WEATHER_ARCHIVE_LAG_DAYS ? WEATHER_ARCHIVE_API_URL : WEATHER_FORECAST_API_URL;
}

/** The hourly rows spanning the group's dates; a network, HTTP or JSON failure is simply no weather. */
async function fetchHourly(baseUrl: string, dates: string[], fetchFn: WeatherFetchFn): Promise<OpenMeteoHourly | undefined> {
  const sorted = [...dates].sort();

  try {
    const response = await fetchFn(hourlyRangeUrl(baseUrl, sorted[0], sorted[sorted.length - 1]));

    if (!response.ok) {
      return undefined;
    }

    const body: OpenMeteoResponse = await response.json();

    return body.hourly;
  } catch {
    return undefined;
  }
}

function hourlyRangeUrl(baseUrl: string, startDateIso: string, endDateIso: string): string {
  const params = new URLSearchParams({
    latitude: String(WEATHER_LATITUDE),
    longitude: String(WEATHER_LONGITUDE),
    start_date: startDateIso,
    end_date: endDateIso,
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
