/** One sample as a watch recorded it: where it was, and how far into the run that was. */
export interface TrackPoint {
  lat: number;
  lon: number;
  secondsIn: number;
}

/** A sample placed along the recorded line, with the pace the watch was holding around it. */
export interface TrackSample extends TrackPoint {
  /** Distance covered up to this sample, measured along the recording itself. */
  metersIn: number;
  /** Pace over a window centred on this sample, in milliseconds per kilometre. */
  paceMs: number;
}
