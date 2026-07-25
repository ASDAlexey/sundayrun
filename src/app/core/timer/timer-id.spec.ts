import { createTimerId } from './timer-id';
import { TIMER_ID_RANDOM_LENGTH, TIMER_ID_SEPARATOR, TIMER_ID_TIME_LENGTH } from './timer-id.constant';
import {
  EARLIER_TIMER_ID,
  EARLIER_TIMER_ID_NOW_MS,
  LARGEST_TAIL_RANDOM,
  PADDED_TIMER_ID,
  TIMER_ID,
  TIMER_ID_ALPHABET,
  TIMER_ID_NOW_MS,
  TIMER_ID_RANDOM,
} from './timer-id.mock';

describe('createTimerId', () => {
  it('builds a time-sortable id of the local alphabet and keeps the width whatever the inputs', () => {
    const id = createTimerId(TIMER_ID_NOW_MS, () => TIMER_ID_RANDOM);

    expect(id).toBe(TIMER_ID);
    expect(id).toMatch(TIMER_ID_ALPHABET);
    expect(createTimerId(EARLIER_TIMER_ID_NOW_MS, () => TIMER_ID_RANDOM)).toBe(EARLIER_TIMER_ID);
    expect(EARLIER_TIMER_ID < TIMER_ID, 'an older id sorts before a newer one as a plain string').toBe(true);
    expect(
      createTimerId(0, () => 0),
      'the smallest possible inputs are padded to the full width',
    ).toBe(PADDED_TIMER_ID);

    const widest = createTimerId(TIMER_ID_NOW_MS, () => LARGEST_TAIL_RANDOM);

    expect(widest).toMatch(TIMER_ID_ALPHABET);
    expect(widest.length, 'the largest tail does not overflow the fixed width').toBe(
      TIMER_ID_TIME_LENGTH + TIMER_ID_SEPARATOR.length + TIMER_ID_RANDOM_LENGTH,
    );
    expect(widest, 'two ids of the same millisecond differ by their tail').not.toBe(id);
  });
});
