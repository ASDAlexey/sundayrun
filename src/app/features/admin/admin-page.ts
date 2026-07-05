import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { buildSiteMeta } from '../../core/github/site-meta';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { SiteMetaFile } from '../../core/github/site-meta.interface';
import { TokenCheck } from '../../core/github/token-check.enum';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { AdminTokenService } from '../../github/admin-token.service';
import { ArchiveService } from '../../github/archive.service';
import { EventDeleteService } from '../../github/event-delete.service';
import { PublishState } from '../../github/github-storage.enum';
import { SiteMetaService } from '../../github/site-meta.service';
import { EMPTY_TOKEN, TOKEN_HELP_URL, UPLOAD_PAGE_LINK } from './admin-page.constant';
import { RaceListStatus, RaceListStatusType, TokenSaveStatus, TokenSaveStatusType } from './admin-page.enum';
import { AdminRaceItem } from './admin-page.interface';

/**
 * The /admin page: the organiser pastes a fine-grained GitHub PAT; a valid one unlocks the
 * publish wizard, the home-page announcement editor (start time + message) and the race
 * deletion list — the undo for a mistaken upload.
 */
@Component({
  selector: 'app-admin-page',
  imports: [RouterLink],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  readonly #adminToken = inject(AdminTokenService);
  readonly #siteMeta = inject(SiteMetaService);
  readonly #archive = inject(ArchiveService);
  readonly #eventDelete = inject(EventDeleteService);

  readonly status = signal<TokenSaveStatusType>(TokenSaveStatus.idle);
  readonly isAdmin = this.#adminToken.isAdmin;
  /** null until the published meta arrives; the save button stays disabled to avoid blind overwrites. */
  readonly meta = signal<SiteMetaFile | null>(null);
  readonly metaState = this.#siteMeta.state;
  readonly races = signal<AdminRaceItem[]>([]);
  readonly racesStatus = signal<RaceListStatusType>(RaceListStatus.loading);
  /** The race awaiting the second, confirming click; deletion never fires from a single click. */
  readonly pendingSlug = signal<string | null>(null);
  readonly deleteState = this.#eventDelete.state;

  protected readonly statuses = TokenSaveStatus;
  protected readonly publishStates = PublishState;
  protected readonly raceStatuses = RaceListStatus;
  protected readonly tokenHelpUrl = TOKEN_HELP_URL;
  protected readonly uploadLink = UPLOAD_PAGE_LINK;

  constructor() {
    // Prerender ships the page without data; the editor prefill and the race list arrive after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID)) && this.isAdmin()) {
      void this.#loadMeta();
      void this.#loadRaces();
    }
  }

  async save(rawToken: string): Promise<void> {
    const token = rawToken.trim();

    if (token === EMPTY_TOKEN) {
      this.status.set(TokenSaveStatus.empty);

      return;
    }

    this.status.set(TokenSaveStatus.checking);

    const check = await this.#adminToken.validate(token);

    if (check === TokenCheck.valid) {
      this.status.set(TokenSaveStatus.valid);
      this.#adminToken.save(token);
      // The page stays open: the saved card offers «Загрузить забег», the editor needs its prefill.
      await Promise.all([this.#loadMeta(), this.#loadRaces()]);

      return;
    }

    this.status.set(check === TokenCheck.unauthorized ? TokenSaveStatus.unauthorized : TokenSaveStatus.error);
  }

  clear(): void {
    this.#adminToken.clear();
    this.status.set(TokenSaveStatus.idle);
  }

  async saveMeta(startTime: string, announcement: string): Promise<void> {
    const meta = buildSiteMeta(startTime, announcement);

    await this.#siteMeta.save(meta);

    if (this.metaState() === PublishState.success) {
      this.meta.set(meta);
    }
  }

  askDelete(slug: string): void {
    this.pendingSlug.set(slug);
  }

  cancelDelete(): void {
    this.pendingSlug.set(null);
  }

  async confirmDelete(): Promise<void> {
    const slug = this.pendingSlug();

    if (slug === null) {
      return;
    }

    await this.#eventDelete.delete(slug);
    this.pendingSlug.set(null);

    if (this.deleteState() === PublishState.success) {
      this.#applyRaces(this.races().filter((race) => race.slug !== slug));
    }
  }

  async #loadMeta(): Promise<void> {
    try {
      this.meta.set(await this.#siteMeta.load());
    } catch {
      // The editor still opens on a CDN hiccup; saving publishes a fresh file anyway.
      this.meta.set({ ...EMPTY_SITE_META });
    }
  }

  async #loadRaces(): Promise<void> {
    this.racesStatus.set(RaceListStatus.loading);

    try {
      const index = await this.#archive.loadIndex();

      this.#applyRaces(index.events.map(toAdminRaceItem));
    } catch {
      this.racesStatus.set(RaceListStatus.error);
    }
  }

  #applyRaces(races: AdminRaceItem[]): void {
    this.races.set(races);
    this.racesStatus.set(races.length === 0 ? RaceListStatus.empty : RaceListStatus.ready);
  }
}

function toAdminRaceItem(entry: ArchiveIndexEntry): AdminRaceItem {
  return {
    slug: entry.slug,
    number: entry.number,
    dateLong: formatRussianDateLong(entry.dateIso),
    participantCount: entry.participantCount,
  };
}
