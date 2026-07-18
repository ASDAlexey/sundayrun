import { ATHLETES_PAGE_LINK } from '../../../app.constant';
import { SeasonPositions } from '../../../core/history/season-positions.interface';
import { BumpChartView, BumpTooltipView } from './bump-chart.interface';

/**
 * A two-athlete season: Волков leads wire-to-wire, Громов debuts a week later with a deep 34:00
 * and improves to 20:30 at the finale — the dot labels must carry both positions and times.
 */
export const BUMP_DATA: SeasonPositions = {
  eventDates: ['2025-04-06', '2025-04-13', '2025-04-20'],
  lines: [
    {
      key: 'волков виктор',
      displayName: 'Волков Виктор',
      points: [
        { position: 1, bestMs: 1200000 },
        { position: 1, bestMs: 1200000 },
        { position: 1, bestMs: 1200000 },
      ],
    },
    {
      key: 'громов глеб',
      displayName: 'Громов Глеб',
      points: [null, { position: 2, bestMs: 2040000 }, { position: 2, bestMs: 1230000 }],
    },
  ],
  rankedCount: 2,
};

export const HOVERED_KEY = 'волков виктор';

export const HIGHLIGHTED_KEYS = ['громов глеб'];

/** BUMP_DATA laid out with the fixed geometry constants (step 56, row 26, pads 40/8/30). */
export const EXPECTED_BUMP_VIEW: BumpChartView = {
  width: 356,
  height: 90,
  gridX1: 40,
  gridX2: 152,
  rankX: 28,
  tickY: 80,
  nameX: 166,
  ticks: [
    { x: 40, label: '6 апр' },
    { x: 96, label: '13 апр' },
    { x: 152, label: '20 апр' },
  ],
  rows: [
    { y: 21, label: '1', place: 1, active: false, colorVar: null },
    { y: 47, label: '2', place: 2, active: false, colorVar: null },
  ],
  lines: [
    {
      key: 'волков виктор',
      displayName: 'Волков Виктор',
      athleteLink: [ATHLETES_PAGE_LINK, 'волков виктор'],
      colorVar: 'var(--chart-1)',
      path: 'M40 21 C68 21 68 21 96 21 C124 21 124 21 152 21',
      dots: [
        { x: 40, y: 21, label: '6 апреля 2025 г. · №1 · 20:00' },
        { x: 96, y: 21, label: '13 апреля 2025 г. · №1 · 20:00' },
        { x: 152, y: 21, label: '20 апреля 2025 г. · №1 · 20:00' },
      ],
      finalPlace: 1,
      labelY: 21,
      active: false,
      dimmed: false,
    },
    {
      key: 'громов глеб',
      displayName: 'Громов Глеб',
      athleteLink: [ATHLETES_PAGE_LINK, 'громов глеб'],
      colorVar: 'var(--chart-2)',
      path: 'M96 47 C124 47 124 47 152 47',
      dots: [
        { x: 96, y: 47, label: '13 апреля 2025 г. · №2 · 34:00' },
        { x: 152, y: 47, label: '20 апреля 2025 г. · №2 · 20:30' },
      ],
      finalPlace: 2,
      labelY: 47,
      active: false,
      dimmed: false,
    },
  ],
};

/** The leader's first dot sits on the top row (flips the tooltip below) and in the clamped left column. */
export const EXPECTED_TOP_TOOLTIP: BumpTooltipView = {
  x: 100,
  y: 33,
  below: true,
  name: 'Волков Виктор',
  label: '6 апреля 2025 г. · №1 · 20:00',
  colorVar: 'var(--chart-1)',
};

/** A between-the-dots line hover floats the bare name at the cursor — no date, no position. */
export const LINE_MOVE_CLIENT_X = 130;

export const LINE_MOVE_CLIENT_Y = 40;

export const EXPECTED_LINE_TOOLTIP: BumpTooltipView = {
  x: 130,
  y: 52,
  below: true,
  name: 'Волков Виктор',
  label: null,
  colorVar: 'var(--chart-1)',
};

/** A hover past the flip line (y ≥ 60) keeps the tooltip above the cursor instead. */
export const LINE_MOVE_BOTTOM_CLIENT_Y = 70;

export const EXPECTED_BOTTOM_LINE_TOOLTIP: BumpTooltipView = {
  x: 130,
  y: 58,
  below: false,
  name: 'Волков Виктор',
  label: null,
  colorVar: 'var(--chart-1)',
};

/** A one-line season over a two-athlete field: the gutter still ranks everyone. */
export const BUMP_SMALL_DATA: SeasonPositions = {
  eventDates: ['2025-04-06'],
  lines: [{ key: 'ланская лидия', displayName: 'Ланская Лидия', points: [{ position: 1, bestMs: 1260000 }] }],
  rankedCount: 2,
};

/** A single event draws a dot-only path. */
export const EXPECTED_SMALL_PATH = 'M40 21';
