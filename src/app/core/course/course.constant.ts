/**
 * The course as the club declares it, which is not quite what a GPS watch reports.
 *
 * A recording of the route came to 5018 m — the excess is receiver noise and the line the runner
 * actually took, not extra course. The distance people race, compare and put in the protocol is a
 * round 5 km, split 2300 + 2300 + 400, and that is the only distance the site ever shows. The
 * measured figures live in `features/home/course-track/course-geometry.constant.ts` and are used
 * for one thing: deciding *when* along the map's animation each lap ends.
 */
export const COURSE_TOTAL_METERS = 5000;

/** One big lap. The protocol records a split here — the site quotes it as «первый круг, 2,3 км». */
export const COURSE_LAP_METERS = 2300;

/** The short lap that tops the two big ones up to five kilometres. */
export const COURSE_FINAL_LAP_METERS = 400;

/**
 * Both times the runner crosses the lap line, in metres from the start.
 *
 * Two laps means one place on the map and two readings on the clock: the balloon drawn at the
 * start line stands for 2,3 km on the way out and 4,6 km on the way back, and anything pinning a
 * time to it has to say both.
 */
export const COURSE_LAP_CROSSINGS: readonly number[] = [COURSE_LAP_METERS, COURSE_LAP_METERS * 2];
