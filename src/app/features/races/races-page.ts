import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { isoYear } from '../../core/history/iso-year';
import { pluralText } from '../../core/i18n/plural-text';
import { loadWithTransfer } from '../../core/transfer/transfer-load';
import { ArchiveService } from '../../github/archive.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { toRaceListItems } from './race-list-item';
import { RaceCard } from './race-card/race-card';
import { ALL_YEARS_VALUE, RACES_TRANSFER_KEY } from './races-page.constant';
import { RacesStatus, RacesStatusType } from './races-page.enum';
import { RaceListItem, RaceYearGroup } from './races-page.interface';

/** The full race list (newest first — `parseArchiveIndex` guarantees the order), filtered by year chips and grouped under year dividers. */
@Component({
  selector: 'app-races-page',
  imports: [MatProgressSpinnerModule, RaceCard, ReloadButton],
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
  readonly yearGroups = computed(() => toYearGroups(this.visibleRaces()));

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

    return toRaceListItems(index.events);
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

/** Season sections in list order: the list arrives newest-first, so grouping consecutive years keeps it. */
function toYearGroups(races: RaceListItem[]): RaceYearGroup[] {
  const groups: RaceYearGroup[] = [];

  for (const race of races) {
    const year = isoYear(race.slug);
    const group = groups.at(-1);

    if (group?.year === year) {
      group.races.push(race);
      group.countText = raceCountText(group.races.length);
    } else {
      groups.push({ year, countText: raceCountText(1), races: [race] });
    }
  }

  return groups;
}

/**
 * «8 забегов» beside the year. The source locale is ru, so the plural category comes from the
 * ru rules; each form is a separate translatable message, like the other `$localize` labels.
 */
function raceCountText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@races.yearCountOne:${count}:count: забег`,
    few: $localize`:@@races.yearCountFew:${count}:count: забега`,
    many: $localize`:@@races.yearCountMany:${count}:count: забегов`,
  });
}
