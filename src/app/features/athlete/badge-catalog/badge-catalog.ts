import { ChangeDetectionStrategy, Component, ElementRef, computed, input, viewChild } from '@angular/core';

import { YearBadgeRarity } from '../../../core/history/badge-rarity.type';
import { AthleteYearBadges, YearActivity } from '../../../core/history/year-badges';
import { GenderType } from '../../../core/models/gender.enum';
import { YearBadgeChip } from '../../../shared/year-badge/year-badge';
import { badgeCatalogRows } from './badge-catalog-rows';

/**
 * The «Все награды» modal: every badge the archive can award — the earned ones in color,
 * the rest dimmed with the live progress of the current season teasing the next one.
 */
@Component({
  selector: 'app-badge-catalog',
  imports: [YearBadgeChip],
  templateUrl: './badge-catalog.html',
  styleUrl: './badge-catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeCatalog {
  /** The athlete's earned badges per year, newest first. */
  readonly yearBadges = input.required<AthleteYearBadges[]>();
  /** Badge → the share of participants owning it — the chips keep their rarity hints. */
  readonly rarity = input.required<YearBadgeRarity>();
  /** The running calendar year of the progress lines. */
  readonly year = input.required<string>();
  /** The athlete's current-year activity feeding the progress lines. */
  readonly activity = input.required<YearActivity>();
  /** The athlete's gender — the crown chips read as «Королева …» on a woman's page. */
  readonly gender = input<GenderType | null>(null);

  protected readonly rows = computed(() => badgeCatalogRows(this.yearBadges(), this.activity(), this.year()));

  // Signal queries may not sit on an ES-private (#) member — Angular needs the runtime name.
  protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** A native dialog reports a backdrop click as a click on the dialog element itself. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
