import { AthleteRun } from '../models/athlete-history.interface';
import { Gender, GenderType } from '../models/gender.enum';
import { MS_IN_DAY } from './badge-signals.constant';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import {
  FORM_INDEX_DECAY_DAYS,
  FORM_INDEX_TOP_COUNT,
  FORM_INDEX_WINDOW_DAYS,
  FORM_STALE_DAYS,
  SCORE_ROUND_FACTOR,
  WINNER_SCORE_PERCENT,
} from './runner-scores.constant';
import { AthleteRating, EventWinnerTimes, ScoredRun } from './runner-scores.interface';

/** slug → the event's per-gender winning 5 km times, ready for the score scans. */
export function winnerTimesBySlug(events: readonly EventWinnerTimes[]): ReadonlyMap<string, EventWinnerTimes> {
  return new Map(events.map((event) => [event.slug, event]));
}

/**
 * The archive's newest event day — the form-index anchor. Anchoring at the data (like the legend
 * window) keeps «последние 12 месяцев» deterministic: no wall clock, no rating drift between two
 * visits over a club pause. An empty archive anchors nothing and rates nobody.
 */
export function newestEventIso(events: readonly EventWinnerTimes[]): string {
  return events.reduce((newest, event) => (event.dateIso > newest ? event.dateIso : newest), '');
}

/**
 * Every 5 km finish scored against the event winner of the athlete's gender, oldest first.
 * A run at an event with no known winner of the gender contributes no score.
 */
export function scoredRuns(runs: readonly AthleteRun[], gender: GenderType, winners: ReadonlyMap<string, EventWinnerTimes>): ScoredRun[] {
  return runs
    .filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM)
    .flatMap<ScoredRun>((run) => {
      const event = winners.get(run.slug);
      const winnerMs = gender === Gender.male ? (event?.bestMaleMs ?? null) : (event?.bestFemaleMs ?? null);

      if (winnerMs === null) {
        return [];
      }

      return [
        { dateIso: run.dateIso, slug: run.slug, timeMs: run.timeMs, score: roundScore((WINNER_SCORE_PERCENT * winnerMs) / run.timeMs) },
      ];
    })
    .sort((left, right) => left.dateIso.localeCompare(right.dateIso));
}

/** Runner Rank — the plain average score over every scored finish; null with nothing scored. */
export function runnerRank(scored: readonly ScoredRun[]): number | null {
  if (scored.length === 0) {
    return null;
  }

  return roundScore(scored.reduce((sum, run) => sum + run.score, 0) / scored.length);
}

/**
 * «Индекс формы» — the weighted average of the FORM_INDEX_TOP_COUNT best scores of the last
 * FORM_INDEX_WINDOW_DAYS, where a fresher run weighs more (a year-old one exactly half of
 * today's). A year without a scored finish makes no index — the rating lists the active only.
 * A break longer than FORM_STALE_DAYS also erases the index, even with a strong year-old finish
 * still inside the window: a runner silent for a season has no current form.
 */
export function formIndex(scored: readonly ScoredRun[], todayIso: string): number | null {
  if (isFormStale(scored, todayIso)) {
    return null;
  }

  // A fresh newest run (isFormStale gate above) is inside the year window, so the window is never empty here.
  const top = windowScoredRuns(scored, todayIso)
    .sort((left, right) => right.score - left.score)
    .slice(0, FORM_INDEX_TOP_COUNT);

  const weighted = top.map((run) => ({
    score: run.score,
    weight: (FORM_INDEX_DECAY_DAYS - ageDays(run.dateIso, todayIso)) / FORM_INDEX_DECAY_DAYS,
  }));
  const weightSum = weighted.reduce((sum, run) => sum + run.weight, 0);

  return roundScore(weighted.reduce((sum, run) => sum + run.score * run.weight, 0) / weightSum);
}

/** «Локальный грейд» — the percent of the gender course record ran by the athlete's best. */
export function localGrade(bestMs: number | null, courseRecordMs: number | null): number | null {
  if (bestMs === null || courseRecordMs === null) {
    return null;
  }

  return roundScore((WINNER_SCORE_PERCENT * courseRecordMs) / bestMs);
}

/** The whole «Рейтинг» card of one athlete; a genderless athlete gets the empty rating. */
export function athleteRating(
  runs: readonly AthleteRun[],
  gender: GenderType | null,
  winners: ReadonlyMap<string, EventWinnerTimes>,
  courseRecordMs: number | null,
  todayIso: string,
): AthleteRating {
  if (gender === null) {
    return { runnerRank: null, formIndex: null, localGrade: null, scoredCount: 0, formRunCount: 0 };
  }

  const scored = scoredRuns(runs, gender, winners);
  const bestMs = runs.reduce<number | null>((best, run) => {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM) {
      return best;
    }

    return best === null ? run.timeMs : Math.min(best, run.timeMs);
  }, null);

  return {
    runnerRank: runnerRank(scored),
    formIndex: formIndex(scored, todayIso),
    localGrade: localGrade(bestMs, courseRecordMs),
    scoredCount: scored.length,
    formRunCount: windowScoredRuns(scored, todayIso).length,
  };
}

/** The scored finishes inside the form-index year, the anchor day included. */
export function windowScoredRuns(scored: readonly ScoredRun[], todayIso: string): ScoredRun[] {
  return scored.filter((run) => ageDays(run.dateIso, todayIso) <= FORM_INDEX_WINDOW_DAYS);
}

/**
 * True when the athlete's newest scored finish predates the freshness window — a break past
 * FORM_STALE_DAYS, so there is no current form to rate. `scored` is oldest-first, so the last
 * entry is the newest; a runless scan is trivially stale.
 */
export function isFormStale(scored: readonly ScoredRun[], todayIso: string): boolean {
  const newest = scored.at(-1);

  return newest === undefined || ageDays(newest.dateIso, todayIso) > FORM_STALE_DAYS;
}

/** Whole days between an ISO run date and the anchor day — both are UTC midnights. */
function ageDays(dateIso: string, todayIso: string): number {
  return (Date.parse(todayIso) - Date.parse(dateIso)) / MS_IN_DAY;
}

/** Scores keep one decimal everywhere, so the card and the board never disagree. */
function roundScore(score: number): number {
  return Math.round(score * SCORE_ROUND_FACTOR) / SCORE_ROUND_FACTOR;
}
