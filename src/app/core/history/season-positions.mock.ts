import { Gender, GenderType } from '../models/gender.enum';
import { SeasonPositionLine, SeasonPositionPoint, SeasonPositions, SeasonRun } from './season-positions.interface';

/** Three season Sundays; the men's standings reshuffle after each one. */
export const SEASON_EVENT_DATES = ['2025-04-06', '2025-04-13', '2025-04-20'];

const FILLER_COUNT = 11;

const FILLER_BASE_MS = 1320000;

const MINUTE_MS = 60000;

const run = (key: string, displayName: string, gender: GenderType | null, dateIso: string, timeMs: number): SeasonRun => ({
  key,
  displayName,
  gender,
  dateIso,
  timeMs,
});

const point = (position: number, bestMs: number): SeasonPositionPoint => ({ position, bestMs });

/** Fillers pad the men's board to 16 ranked athletes: 22:00 + n minutes, run at the first event. */
const fillerName = (index: number): string => `Филлеров Ф${String(index).padStart(2, '0')}`;

const filler = (index: number): SeasonRun =>
  run(fillerName(index).toLowerCase(), fillerName(index), Gender.male, SEASON_EVENT_DATES[0], FILLER_BASE_MS + index * MINUTE_MS);

/**
 * The men's plot: Волков leads wire-to-wire (his later slower runs never hurt); Антонов and Яшин
 * tie at 21:00 and split by name collation; Дубов debuts at the second event; Громов opens with a
 * deep 34:00, slips to sixteenth after Дубов's debut and rockets to second at the finale.
 * A woman and a genderless finisher are noise for the men's chart.
 */
export const SEASON_RUNS: SeasonRun[] = [
  run('волков виктор', 'Волков Виктор', Gender.male, SEASON_EVENT_DATES[0], 1200000),
  run('волков виктор', 'Волков Виктор', Gender.male, SEASON_EVENT_DATES[1], 1350000),
  run('антонов андрей', 'Антонов Андрей', Gender.male, SEASON_EVENT_DATES[0], 1260000),
  run('яшин яков', 'Яшин Яков', Gender.male, SEASON_EVENT_DATES[0], 1260000),
  run('громов глеб', 'Громов Глеб', Gender.male, SEASON_EVENT_DATES[0], 2040000),
  run('громов глеб', 'Громов Глеб', Gender.male, SEASON_EVENT_DATES[2], 1230000),
  run('дубов даниил', 'Дубов Даниил', Gender.male, SEASON_EVENT_DATES[1], 1290000),
  run('ланская лидия', 'Ланская Лидия', Gender.female, SEASON_EVENT_DATES[0], 1260000),
  run('серов саша', 'Серов Саша', null, SEASON_EVENT_DATES[0], 1230000),
  ...Array.from({ length: FILLER_COUNT }, (_, index) => filler(index + 1)),
];

const fillerLine = (index: number): SeasonPositionLine => ({
  key: fillerName(index).toLowerCase(),
  displayName: fillerName(index),
  points: [
    point(3 + index, FILLER_BASE_MS + index * MINUTE_MS),
    point(4 + index, FILLER_BASE_MS + index * MINUTE_MS),
    point(5 + index, FILLER_BASE_MS + index * MINUTE_MS),
  ],
});

/** 16 ranked men — every one of them gets a line, even the slowest filler. */
export const EXPECTED_MEN_RANKED_COUNT = FILLER_COUNT + 5;

export const EXPECTED_MEN_LINES: SeasonPositionLine[] = [
  { key: 'волков виктор', displayName: 'Волков Виктор', points: [point(1, 1200000), point(1, 1200000), point(1, 1200000)] },
  { key: 'громов глеб', displayName: 'Громов Глеб', points: [point(15, 2040000), point(16, 2040000), point(2, 1230000)] },
  { key: 'антонов андрей', displayName: 'Антонов Андрей', points: [point(2, 1260000), point(2, 1260000), point(3, 1260000)] },
  { key: 'яшин яков', displayName: 'Яшин Яков', points: [point(3, 1260000), point(3, 1260000), point(4, 1260000)] },
  { key: 'дубов даниил', displayName: 'Дубов Даниил', points: [null, point(4, 1290000), point(5, 1290000)] },
  ...Array.from({ length: FILLER_COUNT }, (_, index) => fillerLine(index + 1)),
];

/** The lone woman raced only the first Sunday, so her chart has a single event column. */
export const EXPECTED_WOMEN_POSITIONS: SeasonPositions = {
  eventDates: [SEASON_EVENT_DATES[0]],
  lines: [{ key: 'ланская лидия', displayName: 'Ланская Лидия', points: [point(1, 1260000)] }],
  rankedCount: 1,
};
