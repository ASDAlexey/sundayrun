import { ScrollingModule } from '@angular/cdk/scrolling';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { buildSiteMeta } from '../../core/github/site-meta';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { SiteMetaFile } from '../../core/github/site-meta.interface';
import { TokenCheck } from '../../core/github/token-check.enum';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { AdminTokenService } from '../../github/admin-token.service';
import { ArchiveService } from '../../github/archive.service';
import { DbFreshness } from '../../github/db-freshness.enum';
import { DbFreshnessService } from '../../github/db-freshness.service';
import { DeleteDurationService } from '../../github/delete-duration.service';
import { EventDeleteService } from '../../github/event-delete.service';
import { PublishState } from '../../github/github-storage.enum';
import { PendingArchiveService } from '../../github/pending-archive.service';
import { PendingUpload } from '../../github/pending-archive.interface';
import { PublishDurationService } from '../../github/publish-duration.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { bindSearchQueryParam } from '../../shared/search-query-param/search-query-param';
import { ProtocolDropzone } from '../upload/protocol-dropzone/protocol-dropzone';
import {
  ADMIN_RACE_ROW_HEIGHT_PX,
  DELETE_TICK_INTERVAL_MS,
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
  readonly #pendingArchive = inject(PendingArchiveService);
  readonly #publishDuration = inject(PublishDurationService);
  readonly #deleteDuration = inject(DeleteDurationService);
  readonly #dbFreshness = inject(DbFreshnessService);
  readonly #deleteElapsedMs = signal(0);

  /** The deletion whose deploy this session is timing; null once the archive stops serving it. */
  readonly #watchedDeletionSlug = signal<string | null>(null);

  /** Just-published events the archive db has not caught up to yet, shown as «публикуется…» placeholders. */
  readonly #pendingRows = computed<AdminRaceItem[]>(() => {
    const archivedSlugs = new Set(this.races().map((race) => race.slug));
    // A date-corrected re-publish lands under a new slug but keeps the number, so match on both:
    // otherwise the old date's placeholder lingers next to the real, already-served row.
    const archivedNumbers = new Set(this.races().map((race) => race.number));

    return this.#pendingArchive.uploads().reduce<AdminRaceItem[]>((rows, upload) => {
      if (!archivedSlugs.has(upload.slug) && !archivedNumbers.has(upload.number)) {
        rows.push(toPendingRaceItem(upload));
      }

      return rows;
    }, []);
  });

  readonly status = signal<TokenSaveStatusType>(TokenSaveStatus.idle);
  readonly isAdmin = this.#adminToken.isAdmin;
  /** null until the published meta arrives; the publish button stays disabled to avoid blind overwrites. */
  readonly meta = signal<SiteMetaFile | null>(null);
  readonly metaState = this.#siteMeta.state;
  /** The start-time draft the organiser edits before publishing the site meta. */
  readonly draftStartTime = signal(EMPTY_TOKEN);
  /** The archive as the pinned session db serves it; the pending changes below correct it for display. */
  readonly races = signal<AdminRaceItem[]>([]);
  readonly racesStatus = signal<RaceListStatusType>(RaceListStatus.loading);
  readonly query = signal(EMPTY_QUERY);

  /** The list as the organiser should see it: pending uploads on top, just-deleted events dimmed to «удаляется…». */
  readonly allRaces = computed(() => {
    const deleting = new Set(this.#pendingArchive.deletions().map((deletion) => deletion.slug));

    return [...this.#pendingRows(), ...this.races().map((race) => (deleting.has(race.slug) ? { ...race, deleting: true } : race))];
  });

  /** The load status corrected by the pending changes — an empty archive with a placeholder still shows a list. */
  readonly displayStatus = computed<RaceListStatusType>(() => {
    const status = this.racesStatus();

    if (status === RaceListStatus.loading) {
      return status;
    }

    // A failed archive read still surfaces a fresh placeholder; otherwise the pending set flips empty↔ready.
    if (status === RaceListStatus.error) {
      return this.allRaces().length === 0 ? RaceListStatus.error : RaceListStatus.ready;
    }

    return this.allRaces().length === 0 ? RaceListStatus.empty : RaceListStatus.ready;
  });

  readonly filteredRaces = computed(() => {
    const query = this.query().trim().toLowerCase();

    return query === EMPTY_QUERY ? this.allRaces() : this.allRaces().filter((race) => race.searchText.includes(query));
  });

  /** The number the publish wizard will assign to a new upload — one past the maximum; pending uploads count, deleting rows do not. */
  readonly nextNumber = computed(
    () => this.allRaces().reduce((max, race) => (race.deleting === true ? max : Math.max(max, race.number)), NEXT_NUMBER_SEED) + 1,
  );

  /** The measured average of recent publications; null (the static «~2–3 минуты» hint) until one is recorded. */
  readonly averagePublishText = computed(() => {
    const averageMs = this.#publishDuration.averageMs();

    return averageMs === null ? null : formatDuration(averageMs);
  });

  /** The measured average of recent deletions; null (the static «~2–3 минуты» hint) until one is recorded. */
  readonly averageDeleteText = computed(() => {
    const averageMs = this.#deleteDuration.averageMs();

    return averageMs === null ? null : formatDuration(averageMs);
  });

  /** The ticking «прошло m:ss» beside the deletion this session is waiting out. */
  readonly deleteElapsedText = computed(() => formatDuration(this.#deleteElapsedMs()));

  /** The row that shows the live counter: the commit in flight or the deploy being timed. */
  readonly timedDeleteSlug = computed(() => this.deletingSlug() ?? this.#watchedDeletionSlug());

  /** The race awaiting the second, confirming click; deletion never fires from a single click. */
  readonly pendingSlug = signal<string | null>(null);
  /** The race whose deletion commit is in flight; its row dims to «удаляется…» and cannot be re-deleted. */
  readonly deletingSlug = signal<string | null>(null);
  /** The race the confirm modal is asking about; null (no matching slug) keeps the modal closed. */
  readonly pendingRace = computed(() => this.races().find((race) => race.slug === this.pendingSlug()) ?? null);

  readonly deleteState = this.#eventDelete.state;

  protected readonly statuses = TokenSaveStatus;
  protected readonly publishStates = PublishState;
  protected readonly raceStatuses = RaceListStatus;
  protected readonly tokenHelpUrl = TOKEN_HELP_URL;
  protected readonly rowHeightPx = ADMIN_RACE_ROW_HEIGHT_PX;

  /** When the «Точно удалить» click happened; meaningful only while a deletion is being timed. */
  #deleteStartedAtMs = 0;
  #deleteTickId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // `?q=` deep-links the race search: a reload keeps the organiser on the filtered list.
    bindSearchQueryParam(this.query);

    // Prerender ships the page without data; the editor prefill and the race list arrive after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID)) && this.isAdmin()) {
      void this.#loadMeta();
      void this.#loadRaces();
    }

    // The landed deploy retires the «публикуется…»/«удаляется…» rows: the pinned db serves the
    // change now, so the list is re-read without the organiser reloading the page.
    effect(() => {
      if (this.#dbFreshness.state() === DbFreshness.Updated && this.isAdmin()) {
        void this.#loadRaces();
      }
    });

    // The reloaded archive dropping the watched deletion ends its wait: the counter stops and the
    // measured click-to-gone duration feeds the «обычно занимает ~…» hint.
    effect(() => {
      const slug = this.#watchedDeletionSlug();

      if (slug !== null && !this.#pendingArchive.deletions().some((deletion) => deletion.slug === slug)) {
        this.#watchedDeletionSlug.set(null);
        this.#stopDeleteTicking();
        this.#deleteDuration.record(Date.now() - this.#deleteStartedAtMs);
      }
    });

    inject(DestroyRef).onDestroy(() => this.#stopDeleteTicking());
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

    // Close the modal at once; the row dims to «удаляется…» while the feedback strip reports progress.
    this.pendingSlug.set(null);
    this.deletingSlug.set(slug);
    this.#startDeleteTicking();
    await this.#eventDelete.delete(slug);

    // Both success (pointer published) and pending (pointer still catching up) mean the event is gone:
    // the pinned session db still serves it, so remember the deletion — the row stays visible as
    // «удаляется…» until a reloaded archive stops serving it (see `allRaces`).
    const state = this.deleteState();

    if (state === PublishState.success || state === PublishState.pending) {
      this.#pendingArchive.addDeletion({ slug, atIso: new Date().toISOString() });
      this.#watchedDeletionSlug.set(slug);
    } else {
      // The commit never landed — nothing to wait out.
      this.#stopDeleteTicking();
    }

    this.deletingSlug.set(null);
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

      // A reloaded archive that reflects a pending change lets it retire; the rest keep correcting the view.
      this.#pendingArchive.reconcile(
        index.events.map((entry) => entry.slug),
        index.events.map((entry) => entry.number),
        Date.now(),
      );
      this.#applyRaces(index.events.map(toAdminRaceItem));
    } catch {
      this.racesStatus.set(RaceListStatus.error);
    }
  }

  #applyRaces(races: AdminRaceItem[]): void {
    this.races.set(races);
    this.racesStatus.set(races.length === 0 ? RaceListStatus.empty : RaceListStatus.ready);
  }

  #startDeleteTicking(): void {
    this.#stopDeleteTicking();

    const startedAtMs = Date.now();

    this.#deleteStartedAtMs = startedAtMs;
    this.#deleteElapsedMs.set(0);
    this.#deleteTickId = setInterval(() => this.#deleteElapsedMs.set(Date.now() - startedAtMs), DELETE_TICK_INTERVAL_MS);
  }

  #stopDeleteTicking(): void {
    if (this.#deleteTickId !== null) {
      clearInterval(this.#deleteTickId);
      this.#deleteTickId = null;
    }
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

/** A just-published event as a placeholder row: no protocol link or delete yet — the archive is still building it. */
function toPendingRaceItem(upload: PendingUpload): AdminRaceItem {
  const dateLong = formatRussianDateLong(upload.dateIso);

  return {
    slug: upload.slug,
    number: upload.number,
    dateLong,
    participantCount: upload.participantCount,
    raceLink: `${RACE_PAGE_PREFIX}${upload.slug}`,
    searchText: `№ ${upload.number} ${dateLong} ${upload.dateIso}`.toLowerCase(),
    deleteLabel: EMPTY_TOKEN,
    pending: true,
  };
}
