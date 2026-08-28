import { COURSE_LAP_CROSSINGS, COURSE_LAP_METERS, COURSE_TOTAL_METERS } from '../course/course.constant';

/** A pace is quoted per kilometre, so this is the unit every pace figure is divided into. */
export const PACE_UNIT_METERS = 1000;

/** How many of those units the race is — the factor between a finish time and a pace. */
export const PACE_UNITS_IN_RACE = COURSE_TOTAL_METERS / PACE_UNIT_METERS;

const [FIRST_LAP_CROSSING_METERS, SECOND_LAP_CROSSING_METERS] = COURSE_LAP_CROSSINGS;

/**
 * Every point a plan puts a time on, in the order a runner reaches them.
 *
 * The kilometres because that is how people think about pace, and the two lap crossings because
 * those are the only points on this course a runner can recognise without counting: the line they
 * started on, coming round. 2,3 km is also the one split the protocol actually records
 * (`results.time23`), so a plan and the result it was made for line up without arithmetic.
 */
export const PACE_PLAN_METERS: readonly number[] = [
  PACE_UNIT_METERS,
  PACE_UNIT_METERS * 2,
  FIRST_LAP_CROSSING_METERS,
  PACE_UNIT_METERS * 3,
  PACE_UNIT_METERS * 4,
  SECOND_LAP_CROSSING_METERS,
  COURSE_TOTAL_METERS,
];

/**
 * The range a finish time has to fall in to be treated as one.
 *
 * Not a judgement on anybody's running — the floor is under the world record and the ceiling is
 * slower than anyone has ever walked this course. They exist to catch the typo: a missed colon
 * turns 22:00 into 2200:00, and a plan built on that would quote paces in hours with a straight
 * face. Anything outside simply yields no plan, the way empty input does.
 */
export const PACE_PLAN_MIN_FINISH_MS = 12 * 60 * 1000;

export const PACE_PLAN_MAX_FINISH_MS = 2 * 60 * 60 * 1000;

/**
 * The two legs a pacing plan is allowed to differ between, in kilometres.
 *
 * The same cut the protocol already measures: everything about pacing on this site — the index in
 * `core/history/pacing.ts`, the «Негативный сплит» chip, the «Раскладка» card — is 2,3 км against
 * the 2,7 км that follow. A plan that split the race anywhere else would produce numbers nobody
 * could check against their own protocol row afterwards.
 */
export const PACE_PLAN_FIRST_LEG_KM = COURSE_LAP_METERS / PACE_UNIT_METERS;

export const PACE_PLAN_SECOND_LEG_KM = (COURSE_TOTAL_METERS - COURSE_LAP_METERS) / PACE_UNIT_METERS;

/** Even pace: the second leg run at the pace of the first. The plan's default and its floor. */
export const PACE_PLAN_EVEN_INDEX = 1;

/**
 * The index a «второй круг быстрее» plan is built on — the second leg 3% quicker per kilometre.
 *
 * Chosen against the two numbers the site already lives by rather than picked for roundness.
 * Below 1 it is a negative split, so the protocol will mark the finish «Негативный сплит» if it
 * comes off; and 0.97 is exactly `PACING_EVEN_MIN_INDEX`, the edge of the band this site calls an
 * even race — the mildest plan that still counts as speeding up. Anything braver would be the card
 * having an opinion about somebody else's Sunday.
 */
export const PACE_PLAN_NEGATIVE_INDEX = 0.97;
