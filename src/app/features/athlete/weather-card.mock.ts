import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { EventWeatherRow } from '../../core/history/weather-records.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { WeatherBestView } from './weather-card.interface';

/** `WEATHER_RUNS_MOCK` over `WEATHER_ROWS_MOCK` (see weather-records.mock), all time, as the card renders it. */
export const EXPECTED_WEATHER_BEST_VIEWS: WeatherBestView[] = [
  {
    key: 'rain',
    icon: '🌧',
    label: 'В дождь',
    timeText: '24:10',
    temperatureText: '+27°',
    dateShort: '02.06.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-06-02'],
  },
  {
    key: 'snow',
    icon: '🌨',
    label: 'В снег',
    timeText: '25:00',
    temperatureText: '-14°',
    dateShort: '11.02.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-02-11'],
  },
  {
    key: 'frost',
    icon: '❄️',
    label: 'В мороз',
    timeText: '25:00',
    temperatureText: '-14°',
    dateShort: '11.02.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-02-11'],
  },
  {
    key: 'heat',
    icon: '🔥',
    label: 'В жару',
    timeText: '24:10',
    temperatureText: '+27°',
    dateShort: '02.06.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-06-02'],
  },
];

/** A rainy event that stored no temperature: the run qualifies by the code, the chip stays out. */
export const BARE_RAIN_ROWS: EventWeatherRow[] = [
  { slug: '2024-06-02', temperatureC: null, apparentC: null, precipitationMm: 1.2, windKmh: null, weatherCode: 61 },
];

export const BARE_RAIN_RUNS: AthleteRun[] = [
  { dateIso: '2024-06-02', slug: '2024-06-02', timeMs: 1450000, distanceKm: FIVE_KM_DISTANCE_KM },
];

export const EXPECTED_BARE_RAIN_VIEWS: WeatherBestView[] = [
  {
    key: 'rain',
    icon: '🌧',
    label: 'В дождь',
    timeText: '24:10',
    temperatureText: '',
    dateShort: '02.06.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-06-02'],
  },
];

/** The 2025 season keeps only the heat bucket (see EXPECTED_2025_BESTS). */
export const EXPECTED_2025_BEST_VIEWS: WeatherBestView[] = [
  {
    key: 'heat',
    icon: '🔥',
    label: 'В жару',
    timeText: '24:10',
    temperatureText: '+31°',
    dateShort: '13.07.2025 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2025-07-13'],
  },
];
