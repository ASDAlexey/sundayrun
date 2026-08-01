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
  /**
   * Whether this press actually emitted `tap`. Only a press that wrote something may take it back
   * when the browser cancels the pointer: the double-tap guard swallows some presses without
   * emitting, and rolling one of those back would delete the cut before it, which nobody asked for.
   */
  tapped: boolean;
  x: number;
  y: number;
}
