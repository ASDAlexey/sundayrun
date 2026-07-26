/** ПКиО им. Горького, Таганрог — every event runs on the same course, so one point serves the whole archive. */
export const WEATHER_LATITUDE = 47.2362;

export const WEATHER_LONGITUDE = 38.8969;

/** The hourly response is keyed by this timezone, so the start-hour lookup needs no offset math. */
export const WEATHER_TIMEZONE = 'Europe/Moscow';

/** Race start, course-local time; the archive stores the weather of this hour. */
export const RACE_START_HOUR = '09:00';

/** Open-Meteo hourly variables, in `EventWeather` field order. */
export const WEATHER_HOURLY_PARAMS = 'temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code';

/**
 * The window whose rain decides whether the course was still wet: from 18:00 the evening before
 * through 10:00 on race day — an evening shower, a morning one before the start, and the rain that
 * fell on the runners themselves. Both bounds are inclusive hours of the hourly response.
 */
export const WET_WINDOW_START_HOUR = '18:00';

export const WET_WINDOW_END_HOUR = '10:00';

/** The hourly request reaches one day further back than the event dates, to cover the eve of the earliest. */
export const WET_WINDOW_LEAD_DAYS = 1;

/**
 * Millimetres over the window that make the course wet. Open-Meteo resolves hourly precipitation to
 * 0.1 mm, so a single such hour is a trace on the radar rather than water underfoot; two are asphalt
 * that has not dried.
 */
export const WET_COURSE_PRECIPITATION_MM = 0.2;

/** Open-Meteo reports precipitation to one decimal; the window sum is rounded back to it. */
export const MM_ROUNDING_FACTOR = 10;

/** ERA5 reanalysis lags ~5 days behind real time; younger dates are served by the forecast endpoint. */
export const WEATHER_ARCHIVE_LAG_DAYS = 7;

export const WEATHER_ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';

export const WEATHER_FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';

export const MS_PER_DAY = 86400000;
