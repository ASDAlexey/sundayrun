import { formatRaceTime } from '../time/duration';
import { DELTA_EQUAL_PREFIX, DELTA_FASTER_PREFIX, DELTA_SLOWER_PREFIX } from './signed-delta.constant';

/**
 * A gap between two times, signed and formatted for a protocol cell: '−0:21,00', '+0:31,00',
 * '0:00,00'. Both figures the protocol draws beside a finish time — the record delta and the form
 * delta — read out of the same helper, so the two can never disagree about how a sign looks.
 */
export function signedRaceTime(deltaMs: number): string {
  if (deltaMs < 0) {
    return DELTA_FASTER_PREFIX + formatRaceTime(-deltaMs);
  }

  if (deltaMs > 0) {
    return DELTA_SLOWER_PREFIX + formatRaceTime(deltaMs);
  }

  return DELTA_EQUAL_PREFIX + formatRaceTime(deltaMs);
}
