import { TrackSample } from './track-point.interface';

/** One whole kilometre of the recording. Its duration is its pace — that is what a split is. */
export interface TrackSplit {
  /** Which kilometre of the run, counted from one. */
  km: number;
  durationMs: number;
}

/**
 * One race as the athlete's own watch saw it.
 *
 * Everything here is the recording's own arithmetic, uncorrected: the protocol is the official
 * account of the race and this is a second, private one, so the two are shown side by side rather
 * than one being quietly rescaled into the other.
 */
export interface TrackRun {
  samples: TrackSample[];
  /** What the watch measured, which is never the declared five kilometres. */
  distanceM: number;
  durationMs: number;
  /** Average pace over the recording, in milliseconds per kilometre. */
  paceMs: number;
  splits: TrackSplit[];
  /** Never absent: a run this short to qualify at all still contains one whole kilometre. */
  fastestSplit: TrackSplit;
  /** Metres over the declared distance — the tangents nobody runs, in a number. */
  extraM: number;
  /** What those metres cost at this run's own pace. */
  extraMs: number;
  /** Watch minus protocol, when the athlete's official time is known; null when it is not. */
  watchGapMs: number | null;
}
