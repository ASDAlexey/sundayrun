import { PACE_PLAN_MAX_FINISH_MS, PACE_PLAN_METERS, PACE_PLAN_MIN_FINISH_MS } from './pace-plan.constant';
import { paceFromFinish, planFromFinish, planFromPace, toKilometres } from './pace-plan';

/** 22:00 — a round target, and the one the card offers as its example. */
const TARGET_MS = 1_320_000;

/** 4:24 per kilometre, which is what 22:00 over five of them comes to. */
const PACE_MS = 264_000;

describe('planFromFinish', () => {
  it('spreads the target evenly over every point the map can label', () => {
    const plan = planFromFinish(TARGET_MS);

    expect(plan?.paceMs).toBe(PACE_MS);
    expect(plan?.finishMs).toBe(TARGET_MS);
    expect(plan?.splits.map((split) => split.meters)).toEqual([...PACE_PLAN_METERS]);
    expect(plan?.splits.map((split) => split.ms)).toEqual([264_000, 528_000, 607_200, 792_000, 1_056_000, 1_214_400, 1_320_000]);
  });

  it('refuses the typo rather than quoting a pace in hours', () => {
    expect(planFromFinish(PACE_PLAN_MIN_FINISH_MS - 1)).toBeNull();
    expect(planFromFinish(PACE_PLAN_MAX_FINISH_MS + 1)).toBeNull();
    expect(planFromFinish(Number.NaN), 'an unparsed field reaches here as NaN').toBeNull();
    expect(planFromFinish(PACE_PLAN_MIN_FINISH_MS), 'the bounds themselves are plans').not.toBeNull();
    expect(planFromFinish(PACE_PLAN_MAX_FINISH_MS)).not.toBeNull();
  });
});

describe('planFromPace', () => {
  it('is the same plan asked for from the other end', () => {
    expect(planFromPace(PACE_MS)).toEqual(planFromFinish(TARGET_MS));
    expect(planFromPace(1), 'a pace nobody can hold is a target nobody can hold').toBeNull();
  });
});

describe('paceFromFinish and toKilometres', () => {
  it('convert between the two ways of stating the same fact', () => {
    expect(paceFromFinish(TARGET_MS)).toBe(PACE_MS);
    expect(toKilometres(2300)).toBe(2.3);
  });
});
