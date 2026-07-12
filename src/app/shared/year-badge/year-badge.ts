import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { YearBadgeType } from '../../core/history/year-badges.enum';
import { YEAR_BADGE_LABELS, YEAR_BADGE_MODIFIERS } from './year-badge.constant';

/** One yearly achievement chip: «50 забегов за год», «Все 12 месяцев», «Новогодний забег»… */
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

  protected readonly classes = computed(() => `year-badge ${YEAR_BADGE_MODIFIERS[this.badge()]}`);
  protected readonly label = computed(() => YEAR_BADGE_LABELS[this.badge()]);
  protected readonly rarityText = computed(() => toRarityText(this.rarityPercent()));
}

/** «есть у 12% участников» — the smaller a share, the prouder the chip. */
function toRarityText(percent: number | null): string | null {
  return percent === null ? null : $localize`:@@yearBadge.rarity:есть у ${percent}:percent:% участников`;
}
