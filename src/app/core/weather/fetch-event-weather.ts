import { ISO_DATE_LENGTH } from '../history/notables.constant';
import { EventWeather } from './event-weather.interface';
import {
  MM_ROUNDING_FACTOR,
  MS_PER_DAY,
  RACE_START_HOUR,
  WEATHER_ARCHIVE_API_URL,
  WEATHER_ARCHIVE_LAG_DAYS,
  WEATHER_FORECAST_API_URL,
  WEATHER_HOURLY_PARAMS,
  WEATHER_LATITUDE,
  WEATHER_LONGITUDE,
  WEATHER_TIMEZONE,
  WET_WINDOW_END_HOUR,
  WET_WINDOW_LEAD_DAYS,
  WET_WINDOW_START_HOUR,
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

/** The hourly request for one event date — the eve included — against the endpoint that has the date. */
export function weatherRequestUrl(dateIso: string, todayIso: string): string {
  return hourlyRangeUrl(endpointForDate(dateIso, todayIso), eveOf(dateIso), dateIso);
}

/** The day before an ISO date, in the same 'YYYY-MM-DD' shape; the wet-course window starts there. */
function eveOf(dateIso: string): string {
  return new Date(Date.parse(dateIso) - WET_WINDOW_LEAD_DAYS * MS_PER_DAY).toISOString().slice(0, ISO_DATE_LENGTH);
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
    // The range opens on the eve of the earliest date: the wet-course window starts the evening before.
    const response = await fetchFn(hourlyRangeUrl(baseUrl, eveOf(sorted[0]), sorted[sorted.length - 1]));

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
  // Read off the whole response, not the start hour: the wet-course window spans hours around it,
  // and a response that misses 9:00 can still be missing the window entirely.
  const recentPrecipitationMm = sumWetWindow(hourly, dateIso);
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
    recentPrecipitationMm,
  };

  return weather.temperatureC === null ? null : weather;
}

/**
 * The rain that decides whether the course was still wet: every hourly reading from the eve's 18:00
 * through the race day's 10:00, summed. Local ISO timestamps sort as text, so the window is a plain
 * string range over `time`. Null when the response covers none of those hours — an absent window is
 * not a dry one.
 */
function sumWetWindow(hourly: OpenMeteoHourly | undefined, dateIso: string): number | null {
  const from = `${eveOf(dateIso)}T${WET_WINDOW_START_HOUR}`;
  const to = `${dateIso}T${WET_WINDOW_END_HOUR}`;
  const times = hourly?.time ?? [];
  let total: number | null = null;

  for (const [index, time] of times.entries()) {
    if (time >= from && time <= to) {
      total = (total ?? 0) + (hourly?.precipitation?.[index] ?? 0);
    }
  }

  return total === null ? null : roundMillimetres(total);
}

/** Float addition of tenths drifts (0.1 + 0.2); the stored sum keeps the source's one decimal. */
function roundMillimetres(millimetres: number): number {
  return Math.round(millimetres * MM_ROUNDING_FACTOR) / MM_ROUNDING_FACTOR;
}
