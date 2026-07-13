import { ScrollingModule } from '@angular/cdk/scrolling';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { ProtocolDropzone } from '../upload/protocol-dropzone/protocol-dropzone';
import {
  ADMIN_RACE_ROW_HEIGHT_PX,
  EMPTY_QUERY,
  EMPTY_TOKEN,
  NEXT_NUMBER_SEED,
  RACE_PAGE_PREFIX,
  TOKEN_HELP_URL,
} from './admin-page.constant';
import { RaceListStatus, RaceListStatusType, TokenSaveStatus, TokenSaveStatusType } from './admin-page.enum';
import { AdminRaceItem } from './admin-page.interface';

/**
 * The /admin page: the organiser pastes a fine-grained GitHub PAT; a valid one unlocks the
 * organiser panel — the protocol intake zone, the home-page start-time editor and the searchable
 * list of published races, the undo for a mistaken upload.
 */
@Component({
  selector: 'app-admin-page',
  imports: [MatProgressSpinnerModule, ProtocolDropzone, RouterLink, ScrollingModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscapeKey()' },
})
export class AdminPage {
  readonly #adminToken = inject(AdminTokenService);
  readonly #siteMeta = inject(SiteMetaService);
  readonly #archive = inject(ArchiveService);
  readonly #eventDelete = inject(EventDeleteService);

  readonly status = signal<TokenSaveStatusType>(TokenSaveStatus.idle);
  readonly isAdmin = this.#adminToken.isAdmin;
  /** null until the published meta arrives; the publish button stays disabled to avoid blind overwrites. */
  readonly meta = signal<SiteMetaFile | null>(null);
  readonly metaState = this.#siteMeta.state;
  /** The start-time draft the organiser edits before publishing the site meta. */
  readonly draftStartTime = signal(EMPTY_TOKEN);
  readonly races = signal<AdminRaceItem[]>([]);
  readonly racesStatus = signal<RaceListStatusType>(RaceListStatus.loading);
  readonly query = signal(EMPTY_QUERY);
  readonly filteredRaces = computed(() => {
    const query = this.query().trim().toLowerCase();

    return query === EMPTY_QUERY ? this.races() : this.races().filter((race) => race.searchText.includes(query));
  });

  /** The number the publish wizard will assign to a new upload — one past the archive maximum. */
  readonly nextNumber = computed(() => this.races().reduce((max, race) => Math.max(max, race.number), NEXT_NUMBER_SEED) + 1);
  /** The race awaiting the second, confirming click; deletion never fires from a single click. */
  readonly pendingSlug = signal<string | null>(null);
  /** The race the confirm modal is asking about; null (no matching slug) keeps the modal closed. */
  readonly pendingRace = computed(() => this.races().find((race) => race.slug === this.pendingSlug()) ?? null);

  readonly deleteState = this.#eventDelete.state;

  protected readonly statuses = TokenSaveStatus;
  protected readonly publishStates = PublishState;
  protected readonly raceStatuses = RaceListStatus;
  protected readonly tokenHelpUrl = TOKEN_HELP_URL;
  protected readonly rowHeightPx = ADMIN_RACE_ROW_HEIGHT_PX;

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
      // The page swaps to the panel right away, so the editor prefill and the race list load now.
      await Promise.all([this.#loadMeta(), this.#loadRaces()]);

      return;
    }

    this.status.set(check === TokenCheck.unauthorized ? TokenSaveStatus.unauthorized : TokenSaveStatus.error);
  }

  clear(): void {
    this.#adminToken.clear();
    this.status.set(TokenSaveStatus.idle);
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  onStartTimeInput(startTime: string): void {
    this.draftStartTime.set(startTime);
  }

  async saveMeta(): Promise<void> {
    const meta = buildSiteMeta(this.draftStartTime());

    await this.#siteMeta.save(meta);

    if (this.metaState() === PublishState.success) {
      this.meta.set(meta);
      this.#applyDrafts(meta);
    }
  }

  askDelete(slug: string): void {
    this.pendingSlug.set(slug);
  }

  cancelDelete(): void {
    this.pendingSlug.set(null);
  }

  /** Escape backs out of the confirm modal, matching the backdrop click and the Отмена button. */
  onEscapeKey(): void {
    if (this.pendingSlug() !== null) {
      this.cancelDelete();
    }
  }

  async confirmDelete(): Promise<void> {
    const slug = this.pendingSlug();

    if (slug === null) {
      return;
    }

    // Close the modal at once; the feedback strip below then reports the delete progress.
    this.pendingSlug.set(null);
    await this.#eventDelete.delete(slug);

    if (this.deleteState() === PublishState.success) {
      this.#applyRaces(this.races().filter((race) => race.slug !== slug));
    }
  }

  async #loadMeta(): Promise<void> {
    try {
      const meta = await this.#siteMeta.load();

      this.meta.set(meta);
      this.#applyDrafts(meta);
    } catch {
      // The editor still opens on a CDN hiccup; saving publishes a fresh file anyway.
      this.meta.set({ ...EMPTY_SITE_META });
      this.#applyDrafts(EMPTY_SITE_META);
    }
  }

  #applyDrafts(meta: SiteMetaFile): void {
    this.draftStartTime.set(meta.startTime);
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
  const dateLong = formatRussianDateLong(entry.dateIso);

  return {
    slug: entry.slug,
    number: entry.number,
    dateLong,
    participantCount: entry.participantCount,
    raceLink: `${RACE_PAGE_PREFIX}${entry.slug}`,
    searchText: `№ ${entry.number} ${dateLong} ${entry.dateIso}`.toLowerCase(),
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    deleteLabel: $localize`:@@admin.raceDeleteLabel:Удалить забег № ${entry.number}:number:`,
  };
}
