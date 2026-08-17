import { parseGpx } from './parse-gpx';
import { GPX_EMPTY_MOCK, GPX_FILE_MOCK } from './parse-gpx.mock';

describe('parseGpx', () => {
  it('reads the stamped points and times them from the first one', () => {
    const points = parseGpx(GPX_FILE_MOCK);

    expect(points, 'the point without a <time> is dropped rather than guessed at').toEqual([
      { lat: 47.2205832, lon: 38.9222712, secondsIn: 0 },
      { lat: 47.2205549, lon: 38.9222738, secondsIn: 20 },
    ]);
  });

  it('reads a file with no points as no track', () => {
    expect(parseGpx(GPX_EMPTY_MOCK)).toEqual([]);
  });
});
