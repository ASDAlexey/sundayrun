import { isoToday } from './iso-today';
import { FROZEN_NOW_ISO, FROZEN_TODAY_ISO } from './iso-today.mock';

describe('isoToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the UTC date part of the current moment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_NOW_ISO));

    expect(isoToday()).toBe(FROZEN_TODAY_ISO);
  });
});
