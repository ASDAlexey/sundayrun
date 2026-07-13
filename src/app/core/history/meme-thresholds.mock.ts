import { MemeStanding, MemeThreshold } from './meme-thresholds.interface';

/** A three-step ladder listed out of time order, so no pre-sorted input is assumed. */
export const MEME_TEST_THRESHOLDS: MemeThreshold[] = [
  { key: 'chef', name: 'Шеф', note: 'середина лестницы', timeMs: 1500000 },
  { key: 'comet', name: 'Комета', note: 'недосягаемый верх', timeMs: 600000 },
  { key: 'star', name: 'Звезда', note: 'низ лестницы', timeMs: 1800000 },
];

/** 27:00 — slower than Шеф, faster than Звезда. */
export const MEME_MID_BEST_MS = 1620000;

/** The 27:00 best beats only Звезда; Шеф is the next target two minutes away. */
export const EXPECTED_MID_STANDINGS: MemeStanding[] = [
  { key: 'comet', name: 'Комета', note: 'недосягаемый верх', timeMs: 600000, isBeaten: false, isNext: false, gapMs: 1020000 },
  { key: 'chef', name: 'Шеф', note: 'середина лестницы', timeMs: 1500000, isBeaten: false, isNext: true, gapMs: 120000 },
  { key: 'star', name: 'Звезда', note: 'низ лестницы', timeMs: 1800000, isBeaten: true, isNext: false, gapMs: 0 },
];

/** Exactly Шеф's time: «быстрее» means strictly faster, so the benchmark stands with a zero gap. */
export const MEME_EQUAL_BEST_MS = 1500000;

export const EXPECTED_EQUAL_STANDINGS: MemeStanding[] = [
  { key: 'comet', name: 'Комета', note: 'недосягаемый верх', timeMs: 600000, isBeaten: false, isNext: false, gapMs: 900000 },
  { key: 'chef', name: 'Шеф', note: 'середина лестницы', timeMs: 1500000, isBeaten: false, isNext: true, gapMs: 0 },
  { key: 'star', name: 'Звезда', note: 'низ лестницы', timeMs: 1800000, isBeaten: true, isNext: false, gapMs: 0 },
];
