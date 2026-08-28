import { COURSE_LAP_CROSSINGS, COURSE_TOTAL_METERS } from '../../../core/course/course.constant';
import { PACE_UNIT_METERS } from '../../../core/pace/pace-plan.constant';
import { type PacePlanPoint } from './pace-plan.interface';

const [FIRST_LAP_CROSSING_METERS, SECOND_LAP_CROSSING_METERS] = COURSE_LAP_CROSSINGS;

/**
 * Every point of the plan, in the order a runner reaches them, with what to call it.
 *
 * Spelled out rather than assembled from a number and a unit: «2,3 км» has a decimal comma no
 * template can produce without a locale, and «круг» in front of it is the part that makes the row
 * worth reading — it is the only line a runner can act on without kilometre posts the course does
 * not have.
 *
 * The order is the same as `PACE_PLAN_METERS`, which is what lets a plan's splits be read off
 * position rather than looked up. A spec holds the two lists to that promise.
 */
export const PACE_PLAN_POINTS: readonly PacePlanPoint[] = [
  { meters: PACE_UNIT_METERS, label: $localize`:@@pacePlan.km1:1 км`, lap: false },
  { meters: PACE_UNIT_METERS * 2, label: $localize`:@@pacePlan.km2:2 км`, lap: false },
  { meters: FIRST_LAP_CROSSING_METERS, label: $localize`:@@pacePlan.lapOne:круг · 2,3 км`, lap: true },
  { meters: PACE_UNIT_METERS * 3, label: $localize`:@@pacePlan.km3:3 км`, lap: false },
  { meters: PACE_UNIT_METERS * 4, label: $localize`:@@pacePlan.km4:4 км`, lap: false },
  { meters: SECOND_LAP_CROSSING_METERS, label: $localize`:@@pacePlan.lapTwo:круг · 4,6 км`, lap: true },
  { meters: COURSE_TOTAL_METERS, label: $localize`:@@pacePlan.finish:финиш · 5 км`, lap: false },
];

/**
 * Round targets, one tap each.
 *
 * A card that opens on two empty fields asks a visitor to have a goal before it will show them
 * anything, and most people arrive with a vague one at best. These are the times a recreational
 * five kilometres is talked about in, and picking one is also how you find out what the card does.
 */
export const PACE_PLAN_PRESETS: readonly string[] = ['30:00', '25:00', '22:00', '20:00'];

/** How a pace is written next to the number, on the poster where there is no column header. */
export const PACE_PLAN_PER_KM_TEXT = $localize`:@@pacePlan.perKm:/ км`;

export const PACE_PLAN_TITLE_TEXT = $localize`:@@pacePlan.posterTitle:РАСКЛАДКА НА 5 КМ`;

export const PACE_PLAN_FOOTER_TEXT = $localize`:@@pacePlan.posterFooter:Воскресный забег · ПКиО им. Горького · 5 км`;

/**
 * The colour tokens the poster is drawn in, resolved off the live page so a saved picture matches
 * the theme the visitor is looking at.
 */
export const PACE_PLAN_POSTER_TOKENS = {
  paper: '--map-paper',
  ink: '--map-ink',
  inkSoft: '--map-ink-soft',
  route: '--map-route',
  routeCasing: '--map-route-casing',
  mark: '--map-mark',
  accent: '--accent-deep',
  border: '--border',
} as const;

/** Fallbacks for a runtime with no computed styles at all — the prerender worker, mostly. */
export const PACE_PLAN_POSTER_FALLBACK = '#000000';

/**
 * The step between «повторить ЛР» and the next goal up.
 *
 * Half a minute over five kilometres is six seconds a kilometre — a change of pace a person can
 * feel and hold, and small enough that the plan stays a plan rather than a wish. Any rounder step
 * would be either invisible or a different race.
 */
export const PACE_PLAN_STEP_MS = 30 * 1000;

/** Captions of the goals offered to a visitor who has picked themselves in the header. */
export const PACE_PLAN_TARGET_LABELS = {
  best: $localize`:@@pacePlan.targetBest:ЛР`,
  faster: $localize`:@@pacePlan.targetFaster:−30 с`,
  form: $localize`:@@pacePlan.targetForm:форма`,
} as const;

/**
 * The query parameters the card reads on arrival and keeps written as the plan changes, so the
 * address bar is the share button: `?target=22:00&split=neg` opens on somebody else's phone as the
 * plan they were sent, laid out on the map.
 */
export const PACE_PLAN_TARGET_PARAM = 'target';

export const PACE_PLAN_SPLIT_PARAM = 'split';

export const PACE_PLAN_NEGATIVE_SPLIT_VALUE = 'neg';
