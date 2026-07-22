import { formatDuration } from '../time/duration';
import { EMPTY_TIME } from './protocol-builder.constant';

/** Average pace over the covered distance (5 or 2.3 km), min/km; DNF rows stay blank. */
export function paceTextOf(totalMs: number | null, distanceKm: number | null): string {
  if (totalMs === null || distanceKm === null) {
    return EMPTY_TIME;
  }

  return formatDuration(totalMs / distanceKm);
}
