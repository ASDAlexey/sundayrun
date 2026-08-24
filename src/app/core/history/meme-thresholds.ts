import { type MemeStanding, type MemeThreshold } from './meme-thresholds.interface';

/**
 * «Мем-пороги»: the athlete's 5 km best laddered among famous 5 km-equivalent times. A benchmark
 * is beaten only by a strictly faster best — the ladder reads «быстрее X», so an equal time keeps
 * the benchmark standing. The slowest unbeaten benchmark is the next target; every unbeaten one
 * carries the gap still to close. The ladder comes back sorted fastest first.
 */
export function memeStandings(thresholds: readonly MemeThreshold[], bestMs: number): MemeStanding[] {
  const ladder = [...thresholds].sort((left, right) => left.timeMs - right.timeMs);
  // The ladder runs fastest first, so the last already-reached benchmark is the one before the target.
  const nextIndex = ladder.filter((threshold) => threshold.timeMs <= bestMs).length - 1;

  return ladder.map((threshold, index) => ({
    ...threshold,
    isBeaten: bestMs < threshold.timeMs,
    isNext: index === nextIndex,
    gapMs: Math.max(0, bestMs - threshold.timeMs),
  }));
}
