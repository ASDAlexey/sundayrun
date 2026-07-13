import { athleteWeatherBests, weatherExtremes } from './weather-records';
import {
  EXPECTED_2025_BESTS,
  EXPECTED_2025_EXTREMES,
  EXPECTED_ALL_TIME_BESTS,
  EXPECTED_ALL_TIME_EXTREMES,
  WEATHER_BY_SLUG_MOCK,
  WEATHER_ROWS_MOCK,
  WEATHER_RUNS_MOCK,
} from './weather-records.mock';

describe('weatherExtremes', () => {
  it('finds the all-time extremes, keeps records with the earlier event on ties and skips temperature-less rows', () => {
    expect(weatherExtremes(WEATHER_ROWS_MOCK, null)).toEqual(EXPECTED_ALL_TIME_EXTREMES);
  });

  it('scopes to one season and degrades windiest (or everything) to null when the scope stores no readings', () => {
    expect(weatherExtremes(WEATHER_ROWS_MOCK, '2025')).toEqual(EXPECTED_2025_EXTREMES);
    expect(weatherExtremes(WEATHER_ROWS_MOCK, '2019'), 'a season without stored temperatures').toBeNull();
    expect(weatherExtremes([], null)).toBeNull();
  });
});

describe('athleteWeatherBests', () => {
  it('picks the fastest 5 km per bucket, first setter keeping ties, ignoring lap runs and weather-less events', () => {
    expect(athleteWeatherBests(WEATHER_RUNS_MOCK, WEATHER_BY_SLUG_MOCK, null)).toEqual(EXPECTED_ALL_TIME_BESTS);
  });

  it('scopes to one season, leaving the missed buckets null', () => {
    expect(athleteWeatherBests(WEATHER_RUNS_MOCK, WEATHER_BY_SLUG_MOCK, '2025')).toEqual(EXPECTED_2025_BESTS);
  });
});
