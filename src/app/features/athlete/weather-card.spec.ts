import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { WEATHER_ROWS_MOCK, WEATHER_RUNS_MOCK } from '../../core/history/weather-records.mock';
import { EventWeatherRow } from '../../core/history/weather-records.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { WeatherCard } from './weather-card';
import {
  BARE_RAIN_ROWS,
  BARE_RAIN_RUNS,
  EXPECTED_BARE_RAIN_VIEWS,
  EXPECTED_WEATHER_BEST_VIEWS,
  EXPECTED_2025_BEST_VIEWS,
} from './weather-card.mock';

describe('WeatherCard', () => {
  let fixture: ComponentFixture<WeatherCard>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    fixture.destroy();
  });

  function createCard(runs: readonly AthleteRun[], weather: readonly EventWeatherRow[], year: string | null): WeatherCard {
    fixture = TestBed.createComponent(WeatherCard);
    fixture.componentRef.setInput('runs', [...runs]);
    fixture.componentRef.setInput('weather', [...weather]);
    fixture.componentRef.setInput('year', year);

    return fixture.componentInstance;
  }

  it('renders a row per weather bucket with the time, the temperature chip and the race link', () => {
    const card = createCard(WEATHER_RUNS_MOCK, WEATHER_ROWS_MOCK, null);

    expect(card.rows()).toEqual(EXPECTED_WEATHER_BEST_VIEWS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const rows = [...element.querySelectorAll('.weather-card__row')];

    expect(rows.length).toBe(EXPECTED_WEATHER_BEST_VIEWS.length);
    expect(element.querySelector('.weather-card__time').textContent.trim()).toBe(EXPECTED_WEATHER_BEST_VIEWS[0].timeText);
    expect(element.querySelector('.weather-card__date').getAttribute('href')).toContain(String(EXPECTED_WEATHER_BEST_VIEWS[0].raceLink[1]));
  });

  it('narrows to one season through the year input and hides the card when nothing qualifies', () => {
    const card = createCard(WEATHER_RUNS_MOCK, WEATHER_ROWS_MOCK, '2025');

    expect(card.rows()).toEqual(EXPECTED_2025_BEST_VIEWS);

    fixture.componentRef.setInput('runs', BARE_RAIN_RUNS);
    fixture.componentRef.setInput('weather', BARE_RAIN_ROWS);
    fixture.componentRef.setInput('year', null);

    expect(card.rows(), 'a temperature-less rain best renders without the chip').toEqual(EXPECTED_BARE_RAIN_VIEWS);

    fixture.componentRef.setInput('weather', []);

    expect(card.rows(), 'no stored weather at all — no buckets').toEqual([]);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.weather-card')).toBeNull();
  });
});
