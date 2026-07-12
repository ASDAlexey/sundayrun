import { AthleteRun } from '../../core/models/athlete-history.interface';
import { ProgressChartPalette, ProgressDay } from './progress-chart.interface';

const FIVE_KM = 5;

/**
 * Deliberately unsorted, with a slower same-day duplicate on 27.12: the config must
 * collapse each date to its fastest run and order the points chronologically.
 */
export const PROGRESS_RUNS: AthleteRun[] = [
  { dateIso: '2026-01-10', slug: 'kuzminki-3', timeMs: 1_500_000, distanceKm: FIVE_KM },
  { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1_500_000, distanceKm: FIVE_KM },
  { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1_560_000, distanceKm: FIVE_KM },
  { dateIso: '2026-01-03', slug: 'kuzminki-2', timeMs: 1_440_000, distanceKm: FIVE_KM },
];

/** `PROGRESS_RUNS` after the same-day collapse: 25:00 → 24:00 → 25:00 chronologically. */
export const EXPECTED_PROGRESS_DAYS: ProgressDay[] = [
  { dateIso: '2025-12-27', timeMs: 1_500_000 },
  { dateIso: '2026-01-03', timeMs: 1_440_000 },
  { dateIso: '2026-01-10', timeMs: 1_500_000 },
];

export const EXPECTED_IS_BEST = [false, true, false];

/** The all-time best of `PROGRESS_RUNS`. */
export const PROGRESS_BEST_MS = 1_440_000;

/** A record faster than every plotted day: the filtered-out-record case, no green dot may appear. */
export const OFF_CHART_BEST_MS = 1_400_000;

/** The year of `PROGRESS_RUNS` with two race dates — enough for an in-year trend. */
export const CHART_TREND_YEAR = '2026';

/** The year of `PROGRESS_RUNS` with a single race date — no in-year trend, the card hides. */
export const CHART_SINGLE_DATE_YEAR = '2025';

export const EXPECTED_TREND_YEAR_POINTS = [
  { x: Date.parse('2026-01-03'), y: 1_440_000 },
  { x: Date.parse('2026-01-10'), y: 1_500_000 },
];

export const EXPECTED_PROGRESS_POINTS = [
  { x: Date.parse('2025-12-27'), y: 1_500_000 },
  { x: Date.parse('2026-01-03'), y: 1_440_000 },
  { x: Date.parse('2026-01-10'), y: 1_500_000 },
];

export const BEST_POINT_INDEX = 1;

export const REGULAR_POINT_INDEX = 0;

export const EXPECTED_TOOLTIP_TITLE = '27 декабря 2025 г.';

export const EXPECTED_TOOLTIP_TIME = 'Время: 24:00';

export const EXPECTED_TOOLTIP_BEST = 'Личный рекорд';

export const EXPECTED_X_TICK_TEXT = '03.01.26';

export const EXPECTED_Y_TICK_TEXT = '24:00';

/** A second athlete's history for the render-race spec: fewer points than `PROGRESS_RUNS`. */
export const PROGRESS_RUNS_ALT: AthleteRun[] = [
  { dateIso: '2026-02-01', slug: 'kuzminki-7', timeMs: 1_320_000, distanceKm: FIVE_KM },
  { dateIso: '2026-02-08', slug: 'kuzminki-8', timeMs: 1_380_000, distanceKm: FIVE_KM },
];

/** Two runs, one race date — collapses to a single point, which is not a trend yet. */
export const SAME_DAY_ONLY_RUNS: AthleteRun[] = [
  { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1_440_000, distanceKm: FIVE_KM },
  { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1_500_000, distanceKm: FIVE_KM },
];

export const MOCK_PALETTE: ProgressChartPalette = {
  accent: '#f0912d',
  green: '#3ecf8e',
  surface: '#121214',
  border: '#232327',
  borderSoft: '#1b1b1f',
  text: '#efeff1',
  textMuted: '#6e6e76',
  fontMono: 'monospace',
};

// Point-style arrays derived from EXPECTED_IS_BEST and MOCK_PALETTE.

export const EXPECTED_POINT_BACKGROUNDS = ['#121214', '#3ecf8e', '#121214'];

export const EXPECTED_POINT_BACKGROUNDS_NO_BEST = ['#121214', '#121214', '#121214'];

export const EXPECTED_POINT_BORDERS = ['#f0912d', '#3ecf8e', '#f0912d'];

export const EXPECTED_POINT_RADII = [3, 5, 3];

export const EXPECTED_POINT_HOVER_RADII = [5, 7, 5];

export const EXPECTED_AREA_TOP_COLOR = '#f0912d3d';

export const EXPECTED_AREA_BOTTOM_COLOR = '#f0912d00';
