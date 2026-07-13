import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { YearBadgeType } from '../../core/history/year-badges.enum';
import { Gender, GenderType } from '../../core/models/gender.enum';
import {
  YEAR_BADGE_ART,
  YEAR_BADGE_FEMALE_LABELS,
  YEAR_BADGE_LABELS,
  YEAR_BADGE_LAUREL_NUMBERS,
  YEAR_BADGE_MODIFIERS,
  YEAR_BADGE_TIER_NUMBERS,
} from './year-badge.constant';
import { YearBadgeArt } from './year-badge.enum';

/** One yearly award with drawn art: rosette medals, a 12-segment wheel, a snowflake, crowns, laurels, a comeback loop, a heart. */
@Component({
  selector: 'app-year-badge',
  templateUrl: './year-badge.html',
  styleUrl: './year-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearBadgeChip {
  readonly badge = input.required<YearBadgeType>();
  /** The share of participants owning this badge, in whole percents; null hides the rarity hint. */
  readonly rarityPercent = input<number | null>(null);
  /** The owner's gender turns the crown labels into «Королева …»; null keeps the neutral text. */
  readonly gender = input<GenderType | null>(null);

  protected readonly arts = YearBadgeArt;
  protected readonly art = computed(() => YEAR_BADGE_ART[this.badge()]);
  protected readonly classes = computed(() => `year-badge ${YEAR_BADGE_MODIFIERS[this.badge()]}`);
  protected readonly label = computed(() => toLabel(this.badge(), this.gender()));
  protected readonly tierNumber = computed(() => YEAR_BADGE_TIER_NUMBERS[this.badge()]);
  protected readonly laurelNumber = computed(() => YEAR_BADGE_LAUREL_NUMBERS[this.badge()]);
  protected readonly rarityText = computed(() => toRarityText(this.rarityPercent()));
}

function toLabel(badge: YearBadgeType, gender: GenderType | null): string {
  const femaleLabel = gender === Gender.female ? YEAR_BADGE_FEMALE_LABELS[badge] : undefined;

  return femaleLabel ?? YEAR_BADGE_LABELS[badge];
}

/** «есть у 12% участников» — the smaller a share, the prouder the chip. */
function toRarityText(percent: number | null): string | null {
  return percent === null ? null : $localize`:@@yearBadge.rarity:есть у ${percent}:percent:% участников`;
}
