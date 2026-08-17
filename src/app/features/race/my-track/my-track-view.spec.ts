import { buildMyTrackView } from './my-track-view';
import { SHORT_TRACK_RUN_MOCK, TRACK_RUN_MOCK } from './my-track.mock';

describe('buildMyTrackView', () => {
  it('says what the watch measured, in whole seconds and with the protocol beside it', () => {
    const view = buildMyTrackView(TRACK_RUN_MOCK);

    expect(view.distanceText, 'kilometres with the Russian comma').toBe('5,04');
    expect(view.durationText).toBe('18:54');
    expect(view.paceText).toBe('3:45');
    expect(view.fastestKm).toBe(1);
    expect(view.fastestKmText).toBe('3:20');
    expect(view.extraMeters).toBe(42);
    expect(view.extraSeconds).toBe(9);
    expect(view.isLonger).toBe(true);
    expect(view.watchGapSeconds).toBe(4);
    expect(view.officialText, 'the protocol keeps its hundredths — the watch never had any').toBe('18:50,00');
    expect(view.distanceMeters).toBe(TRACK_RUN_MOCK.distanceM);
    expect(view.totalSeconds).toBe(TRACK_RUN_MOCK.samples[TRACK_RUN_MOCK.samples.length - 1].secondsIn);
  });

  it('reads a short recording as short, and stays quiet when there is no official time to compare', () => {
    const view = buildMyTrackView(SHORT_TRACK_RUN_MOCK);

    expect(view.isLonger).toBe(false);
    expect(view.extraMeters, 'the shortfall is printed unsigned; the sentence carries the direction').toBe(60);
    expect(view.extraSeconds).toBe(14);
    expect(view.watchGapSeconds).toBeNull();
    expect(view.officialText).toBeNull();
  });
});
