/**
 * The distance window a recording must land in to be this race.
 *
 * The course is 5 km, and a watch never agrees with it exactly — GPS drift, a late stop, a start
 * pressed early. Wide enough to accept an honest race, narrow enough to reject the warm-up
 * (1.1 km) and the cool-down that share the same morning.
 */
export const RACE_DISTANCE_MIN_M = 4500;

export const RACE_DISTANCE_MAX_M = 6000;
