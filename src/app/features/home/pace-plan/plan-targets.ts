import { FIVE_KM_DISTANCE_KM } from '../../../core/history/distance.constant';
import { athleteForm } from '../../../core/history/form';
import { type AthleteRecord } from '../../../core/models/athlete-history.interface';
import { planFromFinish } from '../../../core/pace/pace-plan';
import { PACE_PLAN_STEP_MS, PACE_PLAN_TARGET_LABELS } from './pace-plan.constant';
import { type PlanTarget } from './plan-targets.interface';

/**
 * The goals a visitor who has said who they are should not have to type.
 *
 * Three, and each one answers a different question. «ЛР» is the time they know they can run,
 * because they have. «−30 с» is the next one, near enough to chase on a Sunday and far enough to
 * need a plan — which is the whole point of the card. «Форма» is the median of the last five
 * finishes, the same figure the form card quotes, and it is the honest one: a personal best set two
 * summers ago is not what today's legs will do, and a plan built on it fails at three kilometres.
 *
 * A record with no five-kilometre history yields nothing and the card falls back to its round
 * presets. Targets outside the plan's own bounds and duplicates of each other are dropped, so a
 * best that *is* the current median offers one button rather than two identical ones.
 */
export function planTargets(record: AthleteRecord | null): PlanTarget[] {
  if (record === null) {
    return [];
  }

  const runs = record.runs.filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM);
  // Anchored on the athlete's own newest finish rather than the archive's: staleness is all that
  // argument decides, and a starting point does not care how long ago the last Sunday was.
  const newest = runs
    .map((run) => run.dateIso)
    .sort((left, right) => left.localeCompare(right))
    .at(-1);
  const form = newest === undefined ? null : athleteForm(runs, newest);
  const candidates: PlanTarget[] = [
    { label: PACE_PLAN_TARGET_LABELS.best, finishMs: record.bestMs ?? Number.NaN },
    { label: PACE_PLAN_TARGET_LABELS.faster, finishMs: (record.bestMs ?? Number.NaN) - PACE_PLAN_STEP_MS },
    { label: PACE_PLAN_TARGET_LABELS.form, finishMs: form?.current.medianMs ?? Number.NaN },
  ];
  const seen = new Set<number>();

  return candidates.filter((target) => {
    const rounded = Math.round(target.finishMs);

    if (seen.has(rounded) || planFromFinish(target.finishMs) === null) {
      return false;
    }

    seen.add(rounded);

    return true;
  });
}
