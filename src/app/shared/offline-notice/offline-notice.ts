import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TIMER_PAGE_LINK } from '../../app.constant';
import { OfflineStatusService } from './offline-status.service';

/**
 * What a data page shows in place of its error state when the device has no network: one short line
 * instead of a technical failure, plus the single thing that works in a park with no signal — the
 * stopwatch, one tap away (docs/TIMER.md §12). With a network, the load failed for some other
 * reason, so the page's own error text and reload button — projected as this component's content —
 * stay exactly as they were.
 */
@Component({
  selector: 'app-offline-notice',
  imports: [RouterLink],
  templateUrl: './offline-notice.html',
  styleUrl: './offline-notice.scss',
})
export class OfflineNotice {
  readonly #status = inject(OfflineStatusService);

  protected readonly offline = this.#status.offline;
  protected readonly timerLink = TIMER_PAGE_LINK;
}
