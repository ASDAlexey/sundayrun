import { PaceToneType } from './pace-tone.enum';

/** One drawn point of the recording: where it is on the map, and when the runner was there. */
export interface TrackFrame {
  x: number;
  y: number;
  secondsIn: number;
  metersIn: number;
  paceMs: number;
  tone: PaceToneType;
}

/** Every stretch run at one pace band, as a single path with many subpaths. */
export interface TrackTrace {
  tone: PaceToneType;
  d: string;
}

/** The pace curve under the map: the same run, read along the distance instead of the park. */
export interface PaceChartView {
  linePoints: string;
  averageY: number;
  /** Kilometre gridlines, labelled with the number of the kilometre they end. */
  ticks: { x: number; label: string }[];
  fastestPaceText: string;
  slowestPaceText: string;
  averagePaceText: string;
}

/** The travelling marker, at one instant of the replay. */
export interface TrackMarker {
  x: number;
  y: number;
  meters: number;
  paceText: string;
}

/** Everything the card draws and says about one recording. */
export interface MyTrackView {
  /**
   * The course map's own frame and alleys, carried in the view rather than imported by the card.
   *
   * Sixteen kilobytes of park geometry are of no use to a reader with no recording, and most
   * readers have none — so the whole builder, this map included, is fetched only once a track has
   * actually come back out of IndexedDB (see `MyTrack`).
   */
  viewBox: string;
  alleyPath: string;
  startPoint: { x: number; y: number };
  finishPoint: { x: number; y: number };
  frames: TrackFrame[];
  traces: TrackTrace[];
  chart: PaceChartView;
  totalSeconds: number;
  /** What the watch measured, for the plate in the corner of the map. */
  distanceMeters: number;
  /** The same distance in kilometres, with the Russian decimal comma: «5,04». */
  distanceText: string;
  durationText: string;
  paceText: string;
  fastestKm: number;
  fastestKmText: string;
  /** How far the recording is from the declared five kilometres, and what that costs — both unsigned. */
  extraMeters: number;
  extraSeconds: number;
  /** Which side of five kilometres the watch landed on. */
  isLonger: boolean;
  /** How far apart the two clocks ended up, in whole seconds; null when the protocol has no time here. */
  watchGapSeconds: number | null;
  /** The protocol's own time, formatted as the protocol prints it; null alongside the gap. */
  officialText: string | null;
}
