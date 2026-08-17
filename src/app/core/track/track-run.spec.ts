import { buildTrackRun } from './track-run';
import {
  HALF_DISTANCE_M,
  NEGATIVE_SPLIT_POINTS_MOCK,
  SHORT_TRACK_POINTS_MOCK,
  SPARSE_TRACK_POINTS_MOCK,
  TRACK_POINTS_MOCK,
} from './track-run.mock';

const OFFICIAL_MS = 1_130_000;

describe('buildTrackRun', () => {
  it('measures the recording, splits it by kilometre and reads it against the protocol', () => {
    const run = buildTrackRun(TRACK_POINTS_MOCK, OFFICIAL_MS);

    expect(run?.distanceM).toBeCloseTo(HALF_DISTANCE_M * 2, 3);
    expect(run?.durationMs).toBe(1_134_000);
    expect(run?.paceMs).toBeCloseTo(225_000, 3);
    expect(run?.splits.map((split) => Math.round(split.durationMs))).toEqual([200_000, 200_000, 224_000, 250_000, 250_000]);
    expect(run?.fastestSplit.km, 'the first of two equal kilometres keeps the title').toBe(1);
    expect(run?.extraM).toBeCloseTo(40, 3);
    expect(run?.extraMs, 'forty metres at this run’s own pace').toBeCloseTo(9_000, 1);
    expect(run?.watchGapMs, 'the watch ran four seconds longer than the protocol').toBe(4_000);

    // Pace is read over a window, so a sample well inside each half carries that half's pace.
    expect(run?.samples[300].paceMs).toBeCloseTo(200_000, 0);
    expect(run?.samples[1000].paceMs).toBeCloseTo(250_000, 0);
    expect(run?.samples[0].metersIn).toBe(0);
  });

  it('leaves the gap unknown when the protocol has no time, and crowns whichever kilometre was quickest', () => {
    expect(buildTrackRun(TRACK_POINTS_MOCK, null)?.watchGapMs).toBeNull();
    expect(buildTrackRun(NEGATIVE_SPLIT_POINTS_MOCK, null)?.fastestSplit.km, 'a race run the other way about ends fastest').toBe(4);
  });

  it('refuses a file with too few samples and a recording too short to be the race', () => {
    expect(buildTrackRun(SPARSE_TRACK_POINTS_MOCK, OFFICIAL_MS)).toBeNull();
    expect(buildTrackRun(SHORT_TRACK_POINTS_MOCK, OFFICIAL_MS)).toBeNull();
  });
});
