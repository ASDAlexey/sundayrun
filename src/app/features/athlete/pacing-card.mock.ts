import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { PacingCardView } from './pacing-card.interface';

/**
 * `athletePacing(PACING_RUNS, PACING_LAPS)` viewed: the median sits 1% under even, two of the
 * four valid splits are negative, and the best one dates back to the earlier of the tied runs.
 */
export const EXPECTED_PACING_CARD_VIEW: PacingCardView = {
  profileText: 'Ровная раскладка',
  medianDeltaText: 'на 1% быстрее',
  negativeCountText: '2 из 4',
  best: { deltaText: 'на 3% быстрее', dateShort: '05.01.2025 г.', raceLink: [RACE_PAGE_BASE_LINK, '2025-01-05'] },
};

/** The fader's view: a slower second lap, no negative split — the best row hides. */
export const EXPECTED_FADE_CARD_VIEW: PacingCardView = {
  profileText: 'Быстрый старт, второй круг тяжелее',
  medianDeltaText: 'на 28% медленнее',
  negativeCountText: '0 из 3',
  best: null,
};

/** Laps a hair under even (index ≈ 0.9987) — the deltas round to zero on both card lines. */
export const NEAR_EVEN_LAPS: AthleteFirstLap[] = [
  { dateIso: '2025-04-06', slug: '2025-04-06', lapMs: 690_500 },
  { dateIso: '2025-04-13', slug: '2025-04-13', lapMs: 690_500 },
  { dateIso: '2025-04-20', slug: '2025-04-20', lapMs: 690_500 },
];

/** Sub-percent negative splits: level median, yet the best row still counts them. */
export const EXPECTED_NEAR_EVEN_CARD_VIEW: PacingCardView = {
  profileText: 'Ровная раскладка',
  medianDeltaText: 'вровень с первым',
  negativeCountText: '3 из 3',
  best: { deltaText: 'менее чем на 1% быстрее', dateShort: '06.04.2025 г.', raceLink: [RACE_PAGE_BASE_LINK, '2025-04-06'] },
};
