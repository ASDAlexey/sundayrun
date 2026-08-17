import { FormDeltaKindType } from './form-delta.enum';

/** What one athlete's ordinary 5 km looked like on the morning of a race — the delta's yardstick. */
export interface FormBaseline {
  /** The median of the finishes below; a single finish is its own median. */
  medianMs: number;
  /** How many finishes went into it — at most `FORM_WINDOW_SIZE`, and named in the hint. */
  runCount: number;
  /** The latest of them, which dates the break the delta refuses to measure across. */
  latestIso: string;
}

/** One result measured against that yardstick: the side it landed on and the figure to draw. */
export interface FormDelta {
  kind: FormDeltaKindType;
  /** Already formatted and signed: '−0:24,20', '≈ +0:07,05'. Empty for `afterBreak` — it has words. */
  text: string;
  /** Whole days between the previous finish and this race, for the hint behind `afterBreak`. */
  restDays: number;
}
