import { PACE_PLAN_STEP_MS, PACE_PLAN_TARGET_LABELS } from './pace-plan.constant';
import { TARGETS_BEST_MS, TARGETS_FORM_MEDIAN_MS, TARGETS_RECORD } from './plan-targets.mock';
import { planTargets } from './plan-targets';

describe('planTargets', () => {
  it('offers the best, the next one up, and the form the legs are actually in', () => {
    expect(planTargets(TARGETS_RECORD)).toEqual([
      { label: PACE_PLAN_TARGET_LABELS.best, finishMs: TARGETS_BEST_MS },
      { label: PACE_PLAN_TARGET_LABELS.faster, finishMs: TARGETS_BEST_MS - PACE_PLAN_STEP_MS },
      { label: PACE_PLAN_TARGET_LABELS.form, finishMs: TARGETS_FORM_MEDIAN_MS },
    ]);
  });

  it('has nothing to offer a visitor the site does not know', () => {
    expect(planTargets(null)).toEqual([]);
  });

  it('keeps quiet about a history too short for either figure', () => {
    expect(planTargets({ ...TARGETS_RECORD, runs: [], bestMs: null })).toEqual([]);
    expect(
      planTargets({ ...TARGETS_RECORD, runs: TARGETS_RECORD.runs.slice(0, 4), bestMs: null }),
      'four finishes make no form window, and no best means no goal built on one',
    ).toEqual([]);
  });

  it('drops a second button that would say the same time as the first', () => {
    const steady = TARGETS_RECORD.runs.map((run) => ({ ...run, timeMs: TARGETS_BEST_MS }));

    expect(planTargets({ ...TARGETS_RECORD, runs: steady }).map((target) => target.label)).toEqual([
      PACE_PLAN_TARGET_LABELS.best,
      PACE_PLAN_TARGET_LABELS.faster,
    ]);
  });

  it('ignores the distances a five-kilometre plan is not about', () => {
    const twoThree = TARGETS_RECORD.runs.map((run) => ({ ...run, distanceKm: 2.3 }));

    expect(planTargets({ ...TARGETS_RECORD, runs: twoThree, bestMs: null }), 'no 5 км history, no goals').toEqual([]);
  });
});
