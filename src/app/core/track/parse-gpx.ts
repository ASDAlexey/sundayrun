import { MS_IN_SECOND } from '../time/duration.constant';
import { GPX_POINT_PATTERN, GPX_TIME_PATTERN } from './parse-gpx.constant';
import { TrackPoint } from './track-point.interface';

/**
 * Reads a GPX recording into the three numbers the site has any use for: where the watch was and
 * how long into the run it was there.
 *
 * A regular expression rather than `DOMParser`, for the same reason `scripts/build-course-track.ts`
 * uses one: a GPX track is one flat list of `<trkpt>` elements, and a 440 KB XML document parsed
 * into a DOM to read two attributes off each node costs more than the file did to fetch.
 *
 * Heart rate and cadence are in the file — Coros writes both into `<extensions>` — and are
 * deliberately left there. Nothing on the personal card reads them yet, and a parser that returns
 * fields nobody displays is a parser nobody can be sure still works.
 *
 * A point without a timestamp is dropped rather than interpolated: the pace it would carry would be
 * invented, and this card exists to show what the watch actually recorded.
 */
export function parseGpx(xml: string): TrackPoint[] {
  const stamped = [...xml.matchAll(GPX_POINT_PATTERN)].flatMap((match) => {
    const stamp = GPX_TIME_PATTERN.exec(match[3]);
    const at = stamp === null ? Number.NaN : Date.parse(stamp[1]);

    return Number.isNaN(at) ? [] : [{ lat: Number(match[1]), lon: Number(match[2]), at }];
  });

  if (stamped.length === 0) {
    return [];
  }

  const startedAt = stamped[0].at;

  return stamped.map(({ lat, lon, at }) => ({ lat, lon, secondsIn: (at - startedAt) / MS_IN_SECOND }));
}
