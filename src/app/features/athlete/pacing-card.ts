import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { athletePacing } from '../../core/history/pacing';
import { AthletePacing } from '../../core/history/pacing.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { EVEN_PACING_INDEX, PACING_PERCENT_BASE, PACING_PROFILE_TEXTS } from './pacing-card.constant';
import { PacingBestView, PacingCardView } from './pacing-card.interface';

/**
 * The «Раскладка» card: how the athlete typically splits a finish between the 2,3 км and 2,7 км
 * laps — the archetype, the median second-lap pace delta, the negative-split tally and the most
 * negative split ever, linked to its race. Fewer than three plausible splits hide the card.
 */
@Component({
  selector: 'app-pacing-card',
  imports: [RouterLink],
  templateUrl: './pacing-card.html',
  styleUrl: './pacing-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacingCard {
  /** The athlete's full history; the pacing joins its 5 km finishes with the laps by slug. */
  readonly runs = input.required<AthleteRun[]>();
  /** Every recorded first-lap split of the athlete. */
  readonly laps = input.required<AthleteFirstLap[]>();
  readonly view = computed(() => toPacingView(athletePacing(this.runs(), this.laps())));
}

function toPacingView(pacing: AthletePacing | null): PacingCardView | null {
  if (pacing === null) {
    return null;
  }

  return {
    profileText: PACING_PROFILE_TEXTS[pacing.profile],
    medianDeltaText: medianDeltaText(Math.round((pacing.medianIndex - EVEN_PACING_INDEX) * PACING_PERCENT_BASE)),
    negativeCountText: $localize`:@@athlete.pacingNegativeCount:${pacing.negativeSplitCount}:count: из ${pacing.validCount}:total:`,
    best: pacing.negativeSplitCount === 0 ? null : toBestView(pacing),
  };
}

/** The percent is signed: above even reads slower, below even faster, zero — dead level. */
function medianDeltaText(percent: number): string {
  if (percent > 0) {
    return $localize`:@@athlete.pacingMedianSlower:на ${percent}:percent:% медленнее`;
  }

  if (percent < 0) {
    return $localize`:@@athlete.pacingMedianFaster:на ${-percent}:percent:% быстрее`;
  }

  return $localize`:@@athlete.pacingMedianEven:вровень с первым`;
}

/** `best` is the minimum index, so a positive negative-split tally guarantees it sits below even. */
function toBestView(pacing: AthletePacing): PacingBestView {
  const percent = Math.round((EVEN_PACING_INDEX - pacing.bestSplit.index) * PACING_PERCENT_BASE);

  return {
    deltaText:
      percent > 0
        ? $localize`:@@athlete.pacingBestDelta:на ${percent}:percent:% быстрее`
        : $localize`:@@athlete.pacingBestDeltaTiny:менее чем на 1% быстрее`,
    dateShort: formatRussianDateShort(pacing.bestSplit.dateIso),
    raceLink: [RACE_PAGE_BASE_LINK, pacing.bestSplit.slug],
  };
}
