import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';

import { DbFreshness } from '../../github/db-freshness.enum';
import { DbFreshnessService } from '../../github/db-freshness.service';

/**
 * The thin shell-wide strip shown while a publication's deploy is in flight: the pages keep
 * serving the previous data underneath, so the banner only promises fresh results in minutes,
 * then turns into a one-click reload once `DbFreshnessService` sees the new db land. Mounting
 * it kicks off the freshness check, so even pages that never query the db surface the state.
 */
@Component({
  selector: 'app-db-freshness-banner',
  templateUrl: './db-freshness-banner.html',
  styleUrl: './db-freshness-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DbFreshnessBanner {
  readonly #document = inject(DOCUMENT);
  readonly #freshness = inject(DbFreshnessService);

  protected readonly state = this.#freshness.state;
  protected readonly states = DbFreshness;

  constructor() {
    this.#freshness.check();
  }

  /** The fresh db is on the server; a reload re-runs every read over it. */
  reload(): void {
    this.#document.defaultView?.location.reload();
  }
}
