import { YearBadgeRarity } from '../../core/history/badge-rarity.type';
import { CourseRecordHistory } from '../../core/history/course-records.type';
import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { LegendFinish } from '../../core/history/legend.interface';
import { RivalRun } from '../../core/history/rivals.interface';
import { EventWinnerTimes } from '../../core/history/runner-scores.interface';
import { YearBestRow } from '../../core/history/year-ranks.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthleteStatusType } from './athlete-page.enum';

/** The resolved page state for one athlete key, applied atomically after the load settles. */
export interface AthletePageState {
  status: AthleteStatusType;
  record: AthleteRecord | null;
  /** A year mapped to the archive's first race date of that year, feeding `athleteYearBadges`. */
  firstEventDateByYear: Record<string, string>;
  /** Every event slug oldest first, feeding `athleteStreaks`. */
  eventSlugs: string[];
  /** Badge → the share of participants owning it — the «есть у 12% участников» hint on the chips. */
  badgeRarity: YearBadgeRarity;
  /** Every finished run of the archive, feeding the «Легенда трассы» window tally. */
  legendFinishes: LegendFinish[];
  /** Slug → the athlete's gender place there, straight from the stored protocol rows. */
  runPlaces: Record<string, number>;
  /** Every 5 km finish at the athlete's events (own rows included), feeding the «Соперники» card. */
  rivalRuns: RivalRun[];
  /** The athlete's fastest recorded first-lap (2.3 km) split; null hides the profile chip. */
  bestFirstLap: AthleteFirstLap | null;
  /** Every athlete-year's best 5 km time, feeding the year-ranking badges. */
  yearBests: YearBestRow[];
  /** The course record progression; its standing holders wear the «Король трассы» badge. */
  courseRecords: CourseRecordHistory;
  /** Every event's per-gender winning times, feeding the «Рейтинг» card scores. */
  winnerEvents: EventWinnerTimes[];
}

/** The «Лучший первый круг» profile value prepared for the template; null hides it. */
export interface FirstLapView {
  timeText: string;
  raceLink: string[];
}

/** One rival prepared for the template: the duel link, the close-finish tally and the score. */
export interface RivalView {
  key: string;
  displayName: string;
  /** The duel page preset to this pair, the athlete on the left. */
  versusLink: string[];
  /** «4 раза рядом» — the pluralized close-finish tally. */
  closeText: string;
  /** «3:1» — the athlete's wins first over those close finishes; draws stay out of the score. */
  score: string;
}

/** The «Легенда трассы» card prepared for the template: the crown itself or the way toward it. */
export interface LegendView {
  /** The athlete holds the crown right now. */
  isLegend: boolean;
  /** «3 финиша» — the athlete's finishes inside the rolling window. */
  countText: string;
  /** The current holder's name; null while the title is vacant. */
  legendName: string | null;
  /** «4 финиша» — the holder's tally inside the window. */
  legendCountText: string;
  /** «2 финиша» — what is left to take the crown; meaningless while the athlete holds it. */
  toCrownText: string;
  /** Progress toward the crown, 0–100; the holder sits at 100. */
  progressPercent: number;
}

/** The «Итоговые забеги» card prepared for the template: best places by race kind and podium tallies. */
export interface PlacementsView {
  /** The best place ever taken at a month-final race; null hides the line. */
  bestFinalPlace: number | null;
  /** The best place taken at a regular race; null hides the line. */
  bestRegularPlace: number | null;
  /** «1-е место ×3» — one chip per podium step taken at least once at finals. */
  podiumTexts: string[];
  /** Any place known at all; false hides the whole card (place-less legacy protocols). */
  hasPlaces: boolean;
}

/** The streaks card prepared for the template: pluralized week counts and the «Раж» tally. */
export interface StreaksView {
  /** «3 недели» — consecutive events counting back from the latest one. */
  currentText: string;
  /** «7 недель» — the longest run of consecutive events. */
  maxText: string;
  /** How many times three 5 km personal records landed in a row; 0 hides the line. */
  rageCount: number;
}

/** One rung of the «Мем-пороги» ladder: a benchmark or the athlete's own row slotted by time. */
export interface MemeRowView {
  key: string;
  name: string;
  /** «темп его марафона 3:30:37 (Лондон, 2004)»; null on the athlete's own row. */
  note: string | null;
  /** The 5 km-equivalent benchmark time, or the athlete's best on the own row. */
  timeText: string;
  /** The athlete's best is strictly faster than this benchmark — the row gets the check mark. */
  isBeaten: boolean;
  /** The athlete's own row — the accent rung showing where the best sits on the ladder. */
  isSelf: boolean;
  /** «9:43» — what is left to the next target; null everywhere but the slowest unbeaten benchmark. */
  gapText: string | null;
}

/** One run prepared for the template: a preformatted date/time/place and a resolved protocol link. */
export interface AthleteRunView {
  slug: string;
  raceLink: string[];
  dateShort: string;
  timeText: string;
  /** The gender place at that event; a dash when the protocol row carries none. */
  placeText: string;
  /** True for the month-final («итоговый») event — the row gets the accent treatment. */
  isMonthFinal: boolean;
}

/** One year's best prepared for the template. */
export interface YearBestView {
  year: string;
  timeText: string;
  raceLink: string[];
  /** True when this year's best IS the all-time record — the cell gets the accent treatment. */
  isAllTime: boolean;
}
