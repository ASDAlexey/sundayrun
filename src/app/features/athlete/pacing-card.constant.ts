import { PacingProfile, type PacingProfileType } from '../../core/history/pacing.enum';

/** The headline of each pacing archetype. */
export const PACING_PROFILE_TEXTS: Record<PacingProfileType, string> = {
  [PacingProfile.negative]: $localize`:@@athlete.pacingProfileNegative:Разгоняется на втором круге`,
  [PacingProfile.even]: $localize`:@@athlete.pacingProfileEven:Ровная раскладка`,
  [PacingProfile.fade]: $localize`:@@athlete.pacingProfileFade:Быстрый старт, второй круг тяжелее`,
};

/** The even pace of both laps — the index the percent deltas are read against. */
export const EVEN_PACING_INDEX = 1;

/** Index deltas render as whole percents. */
export const PACING_PERCENT_BASE = 100;
