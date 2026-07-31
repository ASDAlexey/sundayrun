import { Component, DOCUMENT, computed, effect, inject, input, signal } from '@angular/core';

import { CorosRegion, CorosRegionType } from '../../../core/coros/coros-region.enum';
import { saveTrack } from '../../../state/athlete-track.storage';
import { buildTrackArchive, readTrackArchive } from '../../../state/track-archive';
import { TrackSyncStatus } from '../../../state/track-sync.enum';
import { RaceDay } from '../../../state/track-sync.interface';
import { TrackSyncService } from '../../../state/track-sync.service';
import { WatchAccountService } from '../../../state/watch-account.service';
import { TRACK_EXPORT_FILE_NAME, WATCH_REGION_OPTIONS } from './watch-sync.constant';

/**
 * «Привязать часы» at the top of your own profile.
 *
 * Everything it produces stays on the device: the tracks go to IndexedDB, the account token to
 * localStorage, and nothing is ever uploaded — which is also why the export matters, since a new
 * laptop otherwise starts empty.
 */
@Component({
  selector: 'app-watch-sync',
  templateUrl: './watch-sync.html',
  styleUrl: './watch-sync.scss',
})
export class WatchSync {
  readonly #accounts = inject(WatchAccountService);
  readonly #sync = inject(TrackSyncService);
  readonly #document = inject(DOCUMENT);

  /** The athlete's own races — the only days the sync ever asks the provider about. */
  readonly races = input<RaceDay[]>([]);

  readonly account = this.#accounts.account;
  readonly linked = this.#accounts.linked;
  readonly status = this.#sync.status;
  readonly tracks = this.#sync.tracks;

  readonly formOpen = signal(false);
  readonly email = signal('');
  readonly password = signal('');
  readonly region = signal<CorosRegionType>(CorosRegion.Eu);
  readonly linking = signal(false);
  readonly linkFailed = signal(false);

  readonly trackCount = computed(() => this.tracks().length);

  protected readonly regionOptions = WATCH_REGION_OPTIONS;
  protected readonly statuses = TrackSyncStatus;

  /** The profile loads its races asynchronously; the first non-empty list is what starts the sync. */
  #started = false;

  constructor() {
    effect(() => {
      const races = this.races();

      if (races.length === 0 || this.#started) {
        return;
      }

      this.#started = true;
      void this.#start(races);
    });
  }

  toggleForm(): void {
    this.formOpen.update((open) => !open);
    this.linkFailed.set(false);
  }

  onEmail(value: string): void {
    this.email.set(value);
  }

  onPassword(value: string): void {
    this.password.set(value);
  }

  onRegion(value: string): void {
    const option = WATCH_REGION_OPTIONS.find((candidate) => candidate.value === value);

    if (option !== undefined) {
      this.region.set(option.value);
    }
  }

  /** The password lives exactly as long as this call: it is hashed, sent, and dropped. */
  async link(): Promise<void> {
    this.linking.set(true);
    this.linkFailed.set(false);

    try {
      await this.#accounts.link(this.email(), this.password(), this.region());
      this.password.set('');
      this.formOpen.set(false);
      await this.#sync.sync(this.races());
    } catch {
      this.linkFailed.set(true);
    } finally {
      this.linking.set(false);
      this.password.set('');
    }
  }

  async unlink(): Promise<void> {
    await this.#accounts.unlink();
    await this.#sync.load();
  }

  /** Hands the whole device-local collection back as a zip of plain GPX files. */
  exportTracks(): void {
    // Copied into a fresh array: fflate types its output over any buffer kind, and `Blob` only
    // accepts one backed by a plain `ArrayBuffer`.
    const archive = new Uint8Array(buildTrackArchive(this.tracks()));
    const url = URL.createObjectURL(new Blob([archive], { type: 'application/zip' }));
    const link = this.#document.createElement('a');

    link.href = url;
    link.download = TRACK_EXPORT_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importTracks(file: File | null): Promise<void> {
    if (file === null) {
      return;
    }

    for (const track of readTrackArchive(new Uint8Array(await file.arrayBuffer()))) {
      await saveTrack(track);
    }

    await this.#sync.load();
  }

  /** On every visit: read what is here, then quietly fetch whatever is missing. */
  async #start(races: RaceDay[]): Promise<void> {
    await this.#sync.load();
    await this.#sync.sync(races);
  }
}
