import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { isoYear } from '../../core/history/iso-year';
import { loadWithTransfer } from '../../core/transfer/transfer-load';
import { ArchiveService } from '../../github/archive.service';
import { CdnRefService } from '../../github/cdn-ref.service';
import { toRaceListItem } from './race-list-item';
import { RaceCard } from './race-card/race-card';
import { ALL_YEARS_VALUE, RACES_TRANSFER_KEY } from './races-page.constant';
import { RacesStatus, RacesStatusType } from './races-page.enum';
import { RaceListItem } from './races-page.interface';

/** The full race list (newest first — `parseArchiveIndex` guarantees the order) with a year filter; each card links to the protocol page. */
@Component({
  selector: 'app-races-page',
  imports: [MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule, RaceCard],
  templateUrl: './races-page.html',
  styleUrl: './races-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacesPage {
  readonly #archive = inject(ArchiveService);
  readonly #cdnRef = inject(CdnRefService);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly races = signal<RaceListItem[]>([]);
  readonly year = signal<string | null>(null);
  readonly years = computed(() => distinctYears(this.races()));
  readonly visibleRaces = computed(() => filterByYear(this.races(), this.year()));

  protected readonly statuses = RacesStatus;
  protected readonly allValue = ALL_YEARS_VALUE;

  constructor() {
    // Prerender bakes the full list into the static HTML, so hydration shifts no layout;
    // the browser still refreshes from the CDN — data lands between deploys.
    loadWithTransfer({
      key: RACES_TRANSFER_KEY,
      load: () => this.#loadRaces(),
      apply: (races) => this.#applyRaces(races),
      onError: () => this.status.set(RacesStatus.error),
    });
  }

  onYearChange(value: string): void {
    this.year.set(value === ALL_YEARS_VALUE ? null : value);
  }

  async #loadRaces(): Promise<RaceListItem[]> {
    const index = await this.#archive.loadIndex();
    const ref = await this.#cdnRef.resolve();

    return index.events.map((entry) => toRaceListItem(entry, ref));
  }

  #applyRaces(races: RaceListItem[]): void {
    this.races.set(races);
    this.status.set(races.length === 0 ? RacesStatus.empty : RacesStatus.ready);
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
