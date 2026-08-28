import { COURSE_TOTAL_METERS } from '../course/course.constant';
import {
  PACE_PLAN_MAX_FINISH_MS,
  PACE_PLAN_METERS,
  PACE_PLAN_MIN_FINISH_MS,
  PACE_UNITS_IN_RACE,
  PACE_UNIT_METERS,
} from './pace-plan.constant';
import { type PacePlan, type PacePlanSplit } from './pace-plan.interface';

/**
 * A target finish time turned into the clock readings along the way.
 *
 * Even pace, deliberately. A plan that guessed at a fade or a kick would be a coach's opinion
 * dressed up as arithmetic, and it would be wrong for most people most Sundays; even pace is the
 * one split anybody can hold themselves to and check against a landmark. What the plan is really
 * for is the checking — the site has plenty of numbers about races already run and, until this,
 * none a person could carry to the start line.
 *
 * Returns null for a target outside `PACE_PLAN_MIN_FINISH_MS`…`PACE_PLAN_MAX_FINISH_MS`, which is
 * how a typo and an empty field both end up saying the same thing: no plan yet.
 */
export function planFromFinish(finishMs: number): PacePlan | null {
  if (!Number.isFinite(finishMs) || finishMs < PACE_PLAN_MIN_FINISH_MS || finishMs > PACE_PLAN_MAX_FINISH_MS) {
    return null;
  }

  return {
    finishMs,
    paceMs: finishMs / PACE_UNITS_IN_RACE,
    splits: PACE_PLAN_METERS.map((meters): PacePlanSplit => ({ meters, ms: (finishMs * meters) / COURSE_TOTAL_METERS })),
  };
}

/**
 * The same plan asked for from the other end: «хочу держать по 4:24» rather than «хочу из 22:00».
 *
 * Both fields on the card lead here, which is what lets either one be the one you type in — the
 * pace and the finish are the same fact stated twice, and the card refuses to pick a primary.
 */
export function planFromPace(paceMs: number): PacePlan | null {
  return planFromFinish(paceMs * PACE_UNITS_IN_RACE);
}

/** The pace a finish time implies, in milliseconds per kilometre. */
export function paceFromFinish(finishMs: number): number {
  return finishMs / PACE_UNITS_IN_RACE;
}

/** Metres as the kilometre figure a label quotes: 2300 → 2.3. */
export function toKilometres(meters: number): number {
  return meters / PACE_UNIT_METERS;
}
