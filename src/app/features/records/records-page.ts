import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { topBestResults } from '../../core/history/best-results';
import { TOP_RESULTS_COUNT } from '../../core/history/best-results.constant';
import { BestResult } from '../../core/history/best-results.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender } from '../../core/models/gender.enum';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ATHLETES_PAGE_LINK } from '../athletes/athletes-page.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RecordsStatus, RecordsStatusType } from './records-page.enum';
import { BestResultView } from './records-page.interface';

/** All-time 5 km leaderboards: the fastest men and women with the run where the record was set. */
@Component({
  selector: 'app-records-page',
  imports: [RouterLink],
  templateUrl: './records-page.html',
  styleUrl: './records-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsPage {
  readonly #athletes = inject(AthletesService);
  readonly #records = signal<AthleteRecord[]>([]);

  readonly status = signal<RecordsStatusType>(RecordsStatus.loading);
  readonly men = computed(() => topBestResults(this.#records(), Gender.male, TOP_RESULTS_COUNT).map(toView));
  readonly women = computed(() => topBestResults(this.#records(), Gender.female, TOP_RESULTS_COUNT).map(toView));

  protected readonly statuses = RecordsStatus;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; live data arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#load();
    }
  }

  async #load(): Promise<void> {
    try {
      const records = Object.values(await this.#athletes.loadHistory());

      this.#records.set(records);
      this.status.set(records.length === 0 ? RecordsStatus.empty : RecordsStatus.ready);
    } catch {
      this.status.set(RecordsStatus.error);
    }
  }
}

function toView(result: BestResult, index: number): BestResultView {
  return {
    place: index + 1,
    key: result.key,
    athleteLink: [ATHLETES_PAGE_LINK, result.key],
    displayName: result.displayName,
    timeText: formatDuration(result.bestMs),
    dateShort: formatRussianDateShort(result.dateIso),
    raceLink: [RACE_PAGE_BASE_LINK, result.slug],
  };
}
