import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';

import { ArchiveService } from '../../github/archive.service';
import { toRaceListItem } from './race-list-item';
import { RaceCard } from './race-card/race-card';
import { RacesStatus, RacesStatusType } from './races-page.enum';
import { RaceListItem } from './races-page.interface';

/** The full race list (newest first, as served); each card links to the protocol page. */
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

  protected readonly statuses = RacesStatus;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; live data arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#load();
    }
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
