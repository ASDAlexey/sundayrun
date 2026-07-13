import { EventWeather } from './event-weather.interface';
import { RACE_START_HOUR } from './weather-api.constant';

/** An archive-aged event date and a today far enough past it to route to the archive endpoint. */
export const ARCHIVE_DATE_ISO = '2019-07-28';

export const TODAY_ISO = '2026-07-13';

/** A publication-day date, younger than the archive lag, so it routes to the forecast endpoint. */
export const FRESH_DATE_ISO = '2026-07-12';

export const WEATHER_MOCK: EventWeather = {
  temperatureC: 25.7,
  apparentC: 26.8,
  precipitationMm: 0,
  windKmh: 10.1,
  weatherCode: 0,
};

/** An Open-Meteo hourly body carrying `WEATHER_MOCK` at 9:00, padded with a neighbour hour. */
export const OPEN_METEO_BODY_MOCK = {
  hourly: {
    time: [`${ARCHIVE_DATE_ISO}T08:00`, `${ARCHIVE_DATE_ISO}T${RACE_START_HOUR}`],
    temperature_2m: [24.1, WEATHER_MOCK.temperatureC],
    apparent_temperature: [25, WEATHER_MOCK.apparentC],
    precipitation: [0, WEATHER_MOCK.precipitationMm],
    wind_speed_10m: [9, WEATHER_MOCK.windKmh],
    weather_code: [1, WEATHER_MOCK.weatherCode],
  },
};

/** The same body without the 9:00 row, so the start-hour lookup misses. */
export const OPEN_METEO_MISSING_HOUR_BODY_MOCK = {
  hourly: {
    time: [`${ARCHIVE_DATE_ISO}T08:00`],
    temperature_2m: [24.1],
    apparent_temperature: [25],
    precipitation: [0],
    wind_speed_10m: [9],
    weather_code: [1],
  },
};

/** The 9:00 row exists but every reading array is absent — a temperature-less hour is no weather. */
export const OPEN_METEO_BARE_HOUR_BODY_MOCK = {
  hourly: {
    time: [`${ARCHIVE_DATE_ISO}T${RACE_START_HOUR}`],
  },
};
