import { COMEBACK_MIN_BREAK_DAYS, MS_IN_DAY } from './badge-signals.constant';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { FORM_DELTA_CORRIDOR_RATIO, FORM_DELTA_USUAL_PREFIX } from './form-delta.constant';
import { FormDeltaKind } from './form-delta.enum';
import { FormBaseline, FormDelta } from './form-delta.interface';
import { FORM_WINDOW_SIZE } from './form.constant';
import { medianMs } from './median';
import { ParticipantRun } from './notables.interface';
import { signedRaceTime } from './signed-delta';

/**
 * athleteKey → the median of the last FORM_WINDOW_SIZE 5 km finishes before `dateIso` — the same
 * window the athlete page's «Форма» card rolls, so the protocol and the card cannot describe the
 * same runner differently.
 *
 * Only runs strictly earlier count, so a protocol read years later still says what the runner
 * brought to that start line. A short history is not a reason to stay silent: two finishes make a
 * median of two, one makes a median of itself, and the hint names how thin the sample was. The
 * debut has nothing at all and is absent — the only genuinely unmeasurable row.
 */
export function buildFormBaselines(participantRuns: ParticipantRun[], dateIso: string): Record<string, FormBaseline> {
  const runsByAthlete = new Map<string, ParticipantRun[]>();

  for (const run of participantRuns) {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM || run.dateIso >= dateIso) {
      continue;
    }

    const athleteRuns = runsByAthlete.get(run.athleteKey) ?? [];

    athleteRuns.push(run);
    runsByAthlete.set(run.athleteKey, athleteRuns);
  }

  const baselines: Record<string, FormBaseline> = {};

  for (const [athleteKey, athleteRuns] of runsByAthlete) {
    // Newest first, so the window is the head of the list whatever order the rows arrived in.
    const window = [...athleteRuns].sort((left, right) => right.dateIso.localeCompare(left.dateIso)).slice(0, FORM_WINDOW_SIZE);

    baselines[athleteKey] = {
      medianMs: medianMs(window.map((run) => run.timeMs)),
      runCount: window.length,
      latestIso: window[0].dateIso,
    };
  }

  return baselines;
}

/**
 * How this run compares with that ordinary day — «−0:24,20», «≈ +0:07,05», «+1:12,44».
 *
 * Inside the corridor (see `FORM_DELTA_CORRIDOR_RATIO`) the figure is kept but marked approximate:
 * the run was the runner's usual one, and a protocol that shouted about eleven seconds either way
 * would be inventing a story out of the weather. Beyond it the figure stands plainly on its side.
 *
 * A gap of COMEBACK_MIN_BREAK_DAYS or more before the race — the same break that earns the
 * «Возвращение» badge — yields `afterBreak` and no figure at all. Measuring a comeback against the
 * shape someone was in three months ago answers a question nobody asked, and answers it cruelly.
 * Null — a blank cell — for a debut and for every row without a 5 km time of its own.
 */
export function formDelta(timeMs: number | null, baseline: FormBaseline | undefined, dateIso: string): FormDelta | null {
  if (timeMs === null || baseline === undefined) {
    return null;
  }

  const restDays = Math.round((Date.parse(dateIso) - Date.parse(baseline.latestIso)) / MS_IN_DAY);

  if (restDays >= COMEBACK_MIN_BREAK_DAYS) {
    return { kind: FormDeltaKind.afterBreak, text: '', restDays };
  }

  const deltaMs = timeMs - baseline.medianMs;
  const figure = signedRaceTime(deltaMs);

  if (Math.abs(deltaMs) <= baseline.medianMs * FORM_DELTA_CORRIDOR_RATIO) {
    return { kind: FormDeltaKind.usual, text: FORM_DELTA_USUAL_PREFIX + figure, restDays };
  }

  return { kind: deltaMs < 0 ? FormDeltaKind.faster : FormDeltaKind.slower, text: figure, restDays };
}
