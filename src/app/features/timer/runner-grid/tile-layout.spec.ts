import { TIMER_INK_COUNT, TIMER_INK_FIRST, TIMER_TILE_EMPTY_GIVEN } from './runner-grid.constant';
import {
  GRID_DENSITY_CASES,
  INK_NAME_YE,
  INK_NAME_YO,
  INK_SAMPLE_NAMES,
  NAME_GIVEN,
  NAME_INITIAL,
  NAME_SINGLE,
  NAME_SURNAME,
  NAME_UNTIDY,
} from './runner-grid.mock';
import { resolveTimerDensity, splitTimerName, tileInkIndex } from './tile-layout';

describe('resolveTimerDensity', () => {
  it('steps down at every threshold of the screen budget and obeys a manual pick', () => {
    expect(GRID_DENSITY_CASES.map((sample) => resolveTimerDensity(sample.choice, sample.runnerCount))).toEqual(
      GRID_DENSITY_CASES.map((sample) => sample.density),
    );
  });
});

describe('tileInkIndex', () => {
  it('keeps every ink inside the palette and gives one colour to one person', () => {
    const inks = INK_SAMPLE_NAMES.map((name) => tileInkIndex(name));

    expect(Math.min(...inks)).toBeGreaterThanOrEqual(TIMER_INK_FIRST);
    expect(Math.max(...inks)).toBeLessThanOrEqual(TIMER_INK_COUNT);
    expect(new Set(inks).size, 'a spread of fifteen names uses most of the palette').toBeGreaterThan(TIMER_INK_FIRST);
    expect(tileInkIndex(INK_NAME_YO), 'ё and е are the same person').toBe(tileInkIndex(INK_NAME_YE));
  });
});

describe('splitTimerName', () => {
  it('spells the first name out where there is room and cuts it to an initial where there is not', () => {
    expect(splitTimerName(NAME_UNTIDY, true)).toEqual({ givenName: NAME_GIVEN, surname: NAME_SURNAME });
    expect(splitTimerName(NAME_UNTIDY, false)).toEqual({ givenName: NAME_INITIAL, surname: NAME_SURNAME });
    expect(splitTimerName(NAME_SINGLE, false), 'a single word leaves the second line empty').toEqual({
      givenName: TIMER_TILE_EMPTY_GIVEN,
      surname: NAME_SINGLE,
    });
  });
});
