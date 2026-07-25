/**
 * The recorded time as a keyed frame. Wrapping the string lets `track` read a property instead of
 * the item itself: the key still changes with the time, so the node is recreated and the fly-in plays
 * from scratch, but Angular no longer reports the deliberate re-creation as NG0956.
 */
export interface TimerTileTimeFrame {
  text: string;
}

/** Where and when the finger landed — everything the gesture reader needs on `pointerup`. */
export interface TimerTilePress {
  atMs: number;
  x: number;
  y: number;
}
