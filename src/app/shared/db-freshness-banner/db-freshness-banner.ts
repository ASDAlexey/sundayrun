import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, computed, effect, inject, signal } from '@angular/core';

import { formatDuration } from '../../core/time/duration';
import { DbFreshness } from '../../github/db-freshness.enum';
import { DbFreshnessService } from '../../github/db-freshness.service';
import { UPDATING_TICK_INTERVAL_MS } from './db-freshness-banner.constant';

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
  readonly #elapsedMs = signal(0);

  protected readonly state = this.#freshness.state;
  protected readonly states = DbFreshness;
  protected readonly elapsedText = computed(() => formatDuration(this.#elapsedMs()));

  #tickId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.#freshness.check();

    // The counter is anchored to when this tab first saw the deploy in flight, mirroring
    // the publish page's ticker — visitors see how long the update has been running.
    effect(() => {
      if (this.state() === DbFreshness.Updating) {
        this.#startTicking();
      } else {
        this.#stopTicking();
      }
    });

    inject(DestroyRef).onDestroy(() => this.#stopTicking());
  }

  /** The fresh db is on the server; a reload re-runs every read over it. */
  reload(): void {
    this.#document.defaultView?.location.reload();
  }

  #startTicking(): void {
    this.#stopTicking();

    const startedAtMs = Date.now();

    this.#elapsedMs.set(0);
    this.#tickId = setInterval(() => this.#elapsedMs.set(Date.now() - startedAtMs), UPDATING_TICK_INTERVAL_MS);
  }

  #stopTicking(): void {
    if (this.#tickId !== null) {
      clearInterval(this.#tickId);
      this.#tickId = null;
    }
  }
}
