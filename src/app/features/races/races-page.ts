import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { isoYear } from '../../core/history/iso-year';
import { ArchiveService } from '../../github/archive.service';
import { toRaceListItem } from './race-list-item';
import { RaceCard } from './race-card/race-card';
import { ALL_YEARS_VALUE } from './races-page.constant';
import { RacesStatus, RacesStatusType } from './races-page.enum';
import { RaceListItem } from './races-page.interface';

/** The full race list (newest first, as served) with a year filter; each card links to the protocol page. */
@Component({
  selector: 'app-races-page',
  imports: [RaceCard],
  templateUrl: './races-page.html',
  styleUrl: './races-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacesPage {
  readonly #archive = inject(ArchiveService);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly races = signal<RaceListItem[]>([]);
  readonly year = signal<string | null>(null);
  readonly years = computed(() => distinctYears(this.races()));
  readonly visibleRaces = computed(() => filterByYear(this.races(), this.year()));

  protected readonly statuses = RacesStatus;
  protected readonly allValue = ALL_YEARS_VALUE;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; live data arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#load();
    }
  }

  onYearChange(value: string): void {
    this.year.set(value === ALL_YEARS_VALUE ? null : value);
  }

  async #load(): Promise<void> {
    try {
      const index = await this.#archive.loadIndex();

      this.races.set(index.events.map(toRaceListItem));
      this.status.set(index.events.length === 0 ? RacesStatus.empty : RacesStatus.ready);
    } catch {
      this.status.set(RacesStatus.error);
    }
  }
}

/** Years present in the list, newest first (the list itself arrives newest-first). */
function distinctYears(races: RaceListItem[]): string[] {
  return [...new Set(races.map((race) => isoYear(race.slug)))];
}

function filterByYear(races: RaceListItem[], year: string | null): RaceListItem[] {
  if (year === null) {
    return races;
  }

  return races.filter((race) => isoYear(race.slug) === year);
}
