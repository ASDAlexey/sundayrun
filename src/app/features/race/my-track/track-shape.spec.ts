import { COURSE_START_POINT } from '../../home/course-track/course-geometry.constant';
import { TRACK_RUN_MOCK } from './my-track.mock';
import { PaceTone } from './pace-tone.enum';
import { buildFrames, buildTraces, projectToCourse } from './track-shape';

describe('track shape', () => {
  it('projects a recording into the frame the course map was drawn in', () => {
    const start = projectToCourse({ lat: 47.2205832, lon: 38.9222712 });

    // The very first point of the recording the map was built from, so it has to land on the pin
    // the map draws for the start line — that is the whole claim the georeference makes.
    expect(start.x).toBeCloseTo(COURSE_START_POINT.x, 1);
    expect(start.y).toBeCloseTo(COURSE_START_POINT.y, 1);
  });

  it('thins the samples that would land on top of each other and keeps both ends', () => {
    const frames = buildFrames(TRACK_RUN_MOCK);
    const samples = TRACK_RUN_MOCK.samples;

    expect(frames.length, 'the half-metre steps are dropped').toBeLessThan(samples.length);
    expect(frames[0].metersIn).toBe(samples[0].metersIn);
    expect(frames[frames.length - 1].metersIn, 'the finish survives any thinning').toBe(samples[samples.length - 1].metersIn);
    expect(frames.map((frame) => frame.tone)).toContain(PaceTone.slowest);
  });

  it('cuts the route into stretches of one band each, in the order they were run', () => {
    const frames = buildFrames(TRACK_RUN_MOCK);
    const traces = buildTraces(frames);

    expect(traces.length, 'a run that changes pace changes colour').toBeGreaterThan(1);
    expect(traces.every((trace) => trace.d.startsWith('M'))).toBe(true);
    expect(traces.some((trace) => trace.tone === PaceTone.fastest)).toBe(true);
    const runTones = frames.slice(1).map((frame) => frame.tone);

    expect(
      traces.map((trace) => trace.tone),
      'chronological, so the second lap lies over the first',
    ).toEqual(runTones.filter((tone, index) => index === 0 || tone !== runTones[index - 1]));
  });
});
