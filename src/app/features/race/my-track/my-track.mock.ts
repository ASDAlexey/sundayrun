import { gzipSync, strToU8 } from 'fflate';

import { TrackSample } from '../../../core/track/track-point.interface';
import { TrackRun } from '../../../core/track/track-run.interface';
import { TRACK_POINTS_MOCK } from '../../../core/track/track-run.mock';
import { AthleteTrack } from '../../../state/athlete-track.interface';
import { TrackSource } from '../../../state/track-source.enum';

export const MY_TRACK_SLUG = '2026-08-16';

/** A race the device holds no recording of — the card has to stay away from it. */
export const TRACKLESS_SLUG = '2026-08-09';

export const MY_TRACK_OFFICIAL_MS = 1_130_000;

const SAMPLE_COUNT = 24;

const AVERAGE_PACE_MS = 225_000;

/** Every pace band in turn, so the map, the legend and the chart are all exercised at once. */
const PACE_FACTORS = [0.9, 0.97, 1, 1.03, 1.1];

/** The start line, and a step north that is well over the thinning threshold. */
const BASE_LAT = 47.2205832;

const BASE_LON = 38.9222712;

const LONG_STEP_DEG = 0.0001;

/** Half a metre — two samples this close are the pair the thinning is there to drop. */
const SHORT_STEP_DEG = 0.000005;

const DISTANCE_M = 5042;

const STEP_M = DISTANCE_M / (SAMPLE_COUNT - 1);

const DURATION_MS = 1_134_000;

/**
 * One recording, laid out so that every branch of the drawing has something to do: five pace bands
 * in rotation, and samples alternately far enough apart to keep and close enough to thin away.
 *
 * The positions are schematic — a line marching north from the start line rather than two laps of
 * the park — because nothing under test cares where the park is, only that the projection is
 * applied and the geometry comes out in the map's own units.
 */
export const TRACK_RUN_MOCK: TrackRun = {
  samples: buildSamples(),
  distanceM: DISTANCE_M,
  durationMs: DURATION_MS,
  paceMs: AVERAGE_PACE_MS,
  splits: [
    { km: 1, durationMs: 200_000 },
    { km: 2, durationMs: 224_000 },
    { km: 3, durationMs: 250_000 },
    { km: 4, durationMs: 230_000 },
    { km: 5, durationMs: 230_000 },
  ],
  fastestSplit: { km: 1, durationMs: 200_000 },
  extraM: 42,
  extraMs: 9_450,
  watchGapMs: 4_000,
};

/** The same run as measured by a receiver that came up short, and by a reader nobody picked. */
export const SHORT_TRACK_RUN_MOCK: TrackRun = {
  ...TRACK_RUN_MOCK,
  distanceM: 4_940,
  extraM: -60,
  extraMs: -13_500,
  watchGapMs: null,
};

/** The synthetic race of `TRACK_POINTS_MOCK`, written back out as the file a watch would hand over. */
export const MY_TRACK_GPX = buildGpx();

export const MY_TRACK_STORED: AthleteTrack = {
  slug: MY_TRACK_SLUG,
  source: TrackSource.Coros,
  activityId: '479170300641050727',
  dateIso: MY_TRACK_SLUG,
  distanceM: 5042.93,
  totalTimeS: 1134,
  gpxGzip: gzipSync(strToU8(MY_TRACK_GPX)),
  savedAtIso: '2026-08-16T09:30:00.000Z',
};

/** A race whose recording came back unusable — two points and a stopped watch. */
export const BROKEN_TRACK_SLUG = '2026-08-02';

export const BROKEN_TRACK_STORED: AthleteTrack = {
  ...MY_TRACK_STORED,
  slug: BROKEN_TRACK_SLUG,
  dateIso: BROKEN_TRACK_SLUG,
  gpxGzip: gzipSync(
    strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1"><trk><trkseg>` +
        `<trkpt lat="47.2205832" lon="38.9222712"><time>2026-08-02T06:00:00.000Z</time></trkpt>` +
        `<trkpt lat="47.2205932" lon="38.9222712"><time>2026-08-02T06:00:03.000Z</time></trkpt>` +
        `</trkseg></trk></gpx>`,
    ),
  ),
};

function buildSamples(): TrackSample[] {
  return Array.from({ length: SAMPLE_COUNT }, (_, index) => ({
    lat: BASE_LAT + Math.floor(index / 2) * LONG_STEP_DEG + (index % 2) * SHORT_STEP_DEG,
    lon: BASE_LON,
    secondsIn: (index * DURATION_MS) / ((SAMPLE_COUNT - 1) * 1000),
    metersIn: index * STEP_M,
    paceMs: AVERAGE_PACE_MS * PACE_FACTORS[index % PACE_FACTORS.length],
  }));
}

function buildGpx(): string {
  const startedAt = Date.parse('2026-08-16T06:00:00.000Z');
  const points = TRACK_POINTS_MOCK.map(
    (point) =>
      `<trkpt lat="${point.lat}" lon="${point.lon}"><time>${new Date(startedAt + point.secondsIn * 1000).toISOString()}</time></trkpt>`,
  );

  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1"><trk><trkseg>${points.join('')}</trkseg></trk></gpx>`;
}
