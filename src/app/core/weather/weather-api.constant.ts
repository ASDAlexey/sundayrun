/** ПКиО им. Горького, Таганрог — every event runs on the same course, so one point serves the whole archive. */
export const WEATHER_LATITUDE = 47.2362;

export const WEATHER_LONGITUDE = 38.8969;

/** The hourly response is keyed by this timezone, so the start-hour lookup needs no offset math. */
export const WEATHER_TIMEZONE = 'Europe/Moscow';

/** Race start, course-local time; the archive stores the weather of this hour. */
export const RACE_START_HOUR = '09:00';

/** Open-Meteo hourly variables, in `EventWeather` field order. */
export const WEATHER_HOURLY_PARAMS = 'temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code';

/** ERA5 reanalysis lags ~5 days behind real time; younger dates are served by the forecast endpoint. */
export const WEATHER_ARCHIVE_LAG_DAYS = 7;

export const WEATHER_ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';

export const WEATHER_FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';

export const MS_PER_DAY = 86400000;
