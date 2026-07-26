/**
 * One rendering of a character in a slot. The `seq` is what makes the effect work: a
 * replaced character keeps its node while the arriving one gets a brand-new one, and a
 * brand-new node is the only reliable way to make the browser replay an entrance keyframe.
 */
export interface RollFrame {
  seq: number;
  char: string;
  /** The first character a slot ever shows renders in place; only replacements fly in. */
  enter: boolean;
}

/** One character position of the number — the digit on screen plus the one it just replaced. */
export interface RollSlot {
  index: number;
  live: RollFrame;
  /** Everything to render, live frame last. Never longer than two: the outgoing one is dropped. */
  frames: RollFrame[];
}
