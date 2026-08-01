import { Signal } from '@angular/core';

/** The surface a duration-measuring service re-exposes; publish and delete differ only in the key. */
export interface DurationHistory {
  /** The mean of the recorded durations; null until the first measurement lands. */
  readonly averageMs: Signal<number | null>;
  record(durationMs: number): void;
}
