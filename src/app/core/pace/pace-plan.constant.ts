import { COURSE_LAP_CROSSINGS, COURSE_TOTAL_METERS } from '../course/course.constant';

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
