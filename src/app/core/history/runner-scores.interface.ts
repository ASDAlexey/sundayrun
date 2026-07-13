import { GenderType } from '../models/gender.enum';

/** One event's fastest 5 km time per gender — the score denominators; null when nobody of the gender finished. */
export interface EventWinnerTimes {
  slug: string;
  /** The event day; the newest one anchors the form-index year, keeping the scan clock-free. */
  dateIso: string;
  bestMaleMs: number | null;
  bestFemaleMs: number | null;
}

/** One 5 km finish scored UltraSignup-style: the percent of the event winner's time of the athlete's gender. */
export interface ScoredRun {
  dateIso: string;
  slug: string;
  timeMs: number;
  /** `winner_time / time × 100`, one decimal; the gender winner of the event scores 100. */
  score: number;
}

/** The three profile metrics of the «Рейтинг» card; a metric without source data is null. */
export interface AthleteRating {
  /** Runner Rank — the average score over every scored 5 km finish. */
  runnerRank: number | null;
  /** «Индекс формы» — the weighted average of the best window scores, fresher runs weighing more. */
  formIndex: number | null;
  /** «Локальный грейд» — the percent of the course record of the athlete's gender ran by their best. */
  localGrade: number | null;
  /** How many finishes feed the runner rank. */
  scoredCount: number;
  /** How many finishes fall inside the form-index year. */
  formRunCount: number;
}

/** One row of the combined М+Ж rating board, «кто сейчас в форме» first. */
export interface RatingRow {
  key: string;
  displayName: string;
  gender: GenderType;
  formIndex: number;
  runnerRank: number;
  localGrade: number | null;
  formRunCount: number;
}
