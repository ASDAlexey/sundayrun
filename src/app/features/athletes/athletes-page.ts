import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { searchAthletes, sortAthletes } from '../../core/history/athletes-list';
import { AthletesSort, AthletesSortType } from '../../core/history/athletes-list.enum';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { AthletesService } from '../../github/athletes.service';
import { ATHLETES_PAGE_LINK, NO_BEST_TIME_TEXT } from './athletes-page.constant';
import { AthletesStatus, AthletesStatusType } from './athletes-page.enum';
import { AthleteListItem } from './athletes-page.interface';

/** All known athletes: name search, sorting by best 5 km time or participations, links to personal pages. */
@Component({
  selector: 'app-athletes-page',
  imports: [RouterLink],
  templateUrl: './athletes-page.html',
  styleUrl: './athletes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthletesPage {
  readonly #athletes = inject(AthletesService);
  readonly #records = signal<AthleteRecord[]>([]);

  readonly status = signal<AthletesStatusType>(AthletesStatus.loading);
  readonly query = signal('');
  readonly sort = signal<AthletesSortType>(AthletesSort.bestTime);
  readonly items = computed(() => sortAthletes(searchAthletes(this.#records(), this.query()), this.sort()).map(toListItem));

  protected readonly statuses = AthletesStatus;
  protected readonly sorts = AthletesSort;

  constructor() {
    void this.#load();
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  setSort(sort: AthletesSortType): void {
    this.sort.set(sort);
  }

  async #load(): Promise<void> {
    try {
      const records = Object.values(await this.#athletes.loadHistory());

      this.#records.set(records);
      this.status.set(records.length === 0 ? AthletesStatus.empty : AthletesStatus.ready);
    } catch {
      this.status.set(AthletesStatus.error);
    }
  }
}

function toListItem(record: AthleteRecord): AthleteListItem {
  return {
    key: record.key,
    link: [ATHLETES_PAGE_LINK, record.key],
    displayName: record.displayName,
    participationCount: record.participationSlugs.length,
    bestTimeText: record.bestMs === null ? NO_BEST_TIME_TEXT : formatDuration(record.bestMs),
  };
}
