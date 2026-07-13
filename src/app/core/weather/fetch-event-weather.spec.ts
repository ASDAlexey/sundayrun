import { Mock } from 'vitest';

import { fetchEventWeather, weatherRequestUrl } from './fetch-event-weather';
import {
  ARCHIVE_DATE_ISO,
  FRESH_DATE_ISO,
  OPEN_METEO_BARE_HOUR_BODY_MOCK,
  OPEN_METEO_BODY_MOCK,
  OPEN_METEO_MISSING_HOUR_BODY_MOCK,
  TODAY_ISO,
  WEATHER_MOCK,
} from './fetch-event-weather.mock';
import { WEATHER_ARCHIVE_API_URL, WEATHER_FORECAST_API_URL } from './weather-api.constant';
import { WeatherFetchFn } from './weather-fetch.type';
import { weatherIconOf } from './weather-icon';

const jsonFetch = (body: unknown): Mock<WeatherFetchFn> => vi.fn(() => Promise.resolve(new Response(JSON.stringify(body))));

describe('fetchEventWeather', () => {
  it('routes old dates to the archive endpoint, fresh ones to the forecast endpoint, and parses the 9:00 readings', async () => {
    const fetchFn = jsonFetch(OPEN_METEO_BODY_MOCK);

    await expect(fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO, fetchFn)).resolves.toEqual(WEATHER_MOCK);
    expect(fetchFn.mock.calls[0][0]).toContain(`${WEATHER_ARCHIVE_API_URL}?`);
    expect(fetchFn.mock.calls[0][0]).toContain(`start_date=${ARCHIVE_DATE_ISO}`);
    expect(weatherRequestUrl(FRESH_DATE_ISO, TODAY_ISO)).toContain(`${WEATHER_FORECAST_API_URL}?`);
  });

  it('degrades to null on a network failure, a non-ok status or a response without the start hour', async () => {
    await expect(fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO, () => Promise.reject(new Error('offline')))).resolves.toBeNull();
    await expect(
      fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO, () => Promise.resolve(new Response(null, { status: 429 }))),
    ).resolves.toBeNull();
    await expect(fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO, jsonFetch(OPEN_METEO_MISSING_HOUR_BODY_MOCK))).resolves.toBeNull();
    await expect(fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO, jsonFetch({}))).resolves.toBeNull();
    await expect(
      fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO, jsonFetch(OPEN_METEO_BARE_HOUR_BODY_MOCK)),
      'a 9:00 row without readings is no weather at all',
    ).resolves.toBeNull();
  });

  it('wraps the global fetch by default', async () => {
    const globalFetch = jsonFetch(OPEN_METEO_BODY_MOCK);

    vi.stubGlobal('fetch', globalFetch);

    await expect(fetchEventWeather(ARCHIVE_DATE_ISO, TODAY_ISO)).resolves.toEqual(WEATHER_MOCK);
    expect(globalFetch).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });
});

describe('weatherIconOf', () => {
  it('maps WMO codes to icons and renders nothing for unknown or missing codes', () => {
    expect(weatherIconOf(0)).toBe('☀️');
    expect(weatherIconOf(61)).toBe('🌧️');
    expect(weatherIconOf(95)).toBe('⛈️');
    expect(weatherIconOf(null)).toBe('');
    expect(weatherIconOf(100)).toBe('');
  });
});
