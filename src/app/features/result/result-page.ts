import { ChangeDetectionStrategy, Component, DOCUMENT, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { finishCountsWithDrafts, previousBestsWithDrafts } from '../../core/history/draft-priors';
import { eventFinishCounts } from '../../core/history/finish-counts';
import { PreviousBest } from '../../core/history/previous-bests.interface';
import { composeRaceAnnouncement } from '../../core/share/race-announcement';
import { LINE_SEPARATOR } from '../../core/share/race-announcement.constant';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { AdminTokenService } from '../../github/admin-token.service';
import { CdnRefService } from '../../github/cdn-ref.service';
import { DbFreshness } from '../../github/db-freshness.enum';
import { DbFreshnessService } from '../../github/db-freshness.service';
import { ResultsService } from '../../github/results.service';
import { PublishState } from '../../github/github-storage.enum';
import { GithubStorageService } from '../../github/github-storage.service';
import { PendingArchiveService } from '../../github/pending-archive.service';
import { PublishDurationService } from '../../github/publish-duration.service';
import { triggerBlobDownload } from '../../pdf/blob-download';
import { PdfService } from '../../pdf/pdf.service';
import { PDF_FILE_EXTENSION } from '../../pdf/pdf.service.constant';
import { ProtocolImageService } from '../../pdf/protocol-image.service';
import { PROTOCOL_IMAGE_FILE_EXTENSION, PROTOCOL_IMAGE_MIME_TYPE } from '../../pdf/protocol-image.service.constant';
import { ShareService } from '../../share/share.service';
import { ProtocolPager } from '../../shared/protocol-pager/protocol-pager';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { ADMIN_PAGE_LINK, RACE_PAGE_PREFIX } from '../admin/admin-page.constant';
import {
  DEPLOY_PROGRESS_CAP_PERCENT,
  EMPTY_TEXT,
  EVENT_NUMBER_PREFIX,
  PDF_MIME_TYPE,
  PERCENT_FULL,
  PUBLISH_TICK_INTERVAL_MS,
  SUMMARY_SEPARATOR,
} from './result-page.constant';
import { ResultStatus, ResultStatusType } from './result-page.enum';
import { GeneratedProtocol } from './result-page.interface';
import { PREVIEW_ROUTE_COMMANDS } from './result.guard.constant';

/**
 * The /result page: renders the protocol PDF on entry, previews it and offers download, share, VK
 * repost and archive publish. A multi-file upload pages through its drafts — each draft's PDF is
 * rendered on first visit and cached — and «Опубликовать» sends the WHOLE batch as one commit.
 */
@Component({
  selector: 'app-result-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, ProtocolPager, RouterLink],
  templateUrl: './result-page.html',
  styleUrl: './result-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultPage implements OnDestroy {
  readonly #store = inject(ProtocolStateService);
  readonly #pdf = inject(PdfService);
  readonly #share = inject(ShareService);
  readonly #router = inject(Router);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #github = inject(GithubStorageService);
  readonly #pendingArchive = inject(PendingArchiveService);
  readonly #results = inject(ResultsService);
  readonly #adminToken = inject(AdminTokenService);
  readonly #protocolImage = inject(ProtocolImageService);
  readonly #dbFreshness = inject(DbFreshnessService);
  readonly #publishDuration = inject(PublishDurationService);
  readonly #cdnRef = inject(CdnRefService);
  readonly #document = inject(DOCUMENT);
  readonly #blob = signal<Blob | null>(null);
  readonly #runPhoto = signal<File | null>(null);

  /** Generated artifacts per draft index; paging back to a draft reuses them instead of re-rendering. */
  readonly #generated = new Map<number, GeneratedProtocol>();

  /** True from a successful publish until the deploy wait ends — the freshness effect's gate. */
  readonly #waitingForDeploy = signal(false);
  readonly #elapsedMs = signal(0);
  readonly #publishedInMs = signal<number | null>(null);

  /** The first announcement line doubles as the share/repost title. */
  readonly #titleLine = computed(() => this.description().split(LINE_SEPARATOR)[0]);

  /** The rasterized protocol shares the base name of the pdf, only with a `.png` extension (empty stays empty). */
  readonly #imageFileName = computed(() => this.fileName().replace(PDF_FILE_EXTENSION, PROTOCOL_IMAGE_FILE_EXTENSION));

  readonly status = signal<ResultStatusType>(ResultStatus.generating);
  readonly description = signal(EMPTY_TEXT);
  readonly copied = signal(false);
  readonly objectUrl = signal<string | null>(null);
  readonly isAdmin = this.#adminToken.isAdmin;
  readonly publishState = this.#github.state;
  readonly draftCount = this.#store.draftCount;

  readonly summary = computed(() => {
    const event = this.#store.event();

    return event === null ? EMPTY_TEXT : `${EVENT_NUMBER_PREFIX}${event.number}${SUMMARY_SEPARATOR}${formatRussianDateLong(event.dateIso)}`;
  });

  readonly fileName = computed(() => {
    const event = this.#store.event();

    return event === null ? EMPTY_TEXT : this.#pdf.suggestedFileName(event);
  });

  readonly previewUrl = computed(() => {
    const url = this.objectUrl();

    return url === null ? null : this.#sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly pdfFile = computed(() => {
    const blob = this.#blob();

    return blob === null ? null : new File([blob], this.fileName(), { type: PDF_MIME_TYPE });
  });

  readonly canShare = computed(() => {
    const file = this.pdfFile();

    return file !== null && this.#share.canShareFile(file);
  });

  readonly runPhotoName = computed(() => this.#runPhoto()?.name ?? EMPTY_TEXT);

  /** True once the deploy carrying this publication is live — the wait ends, the race link appears. */
  readonly deployDone = signal(false);
  readonly elapsedText = computed(() => formatDuration(this.#elapsedMs()));

  /** The measured click-to-live time of this publication; null while waiting or when the poll gave up. */
  readonly publishedInText = computed(() => {
    const publishedInMs = this.#publishedInMs();

    return publishedInMs === null ? null : formatDuration(publishedInMs);
  });

  /** The measured average of recent publications; null until the first one is recorded. */
  readonly averagePublishText = computed(() => {
    const averageMs = this.#publishDuration.averageMs();

    return averageMs === null ? null : formatDuration(averageMs);
  });

  /** The wait bar's fill toward the measured average, capped short of full; null (no history) shows the scanning bar. */
  readonly deployProgressPercent = computed<number | null>(() => {
    const averageMs = this.#publishDuration.averageMs();

    return averageMs === null ? null : Math.min(DEPLOY_PROGRESS_CAP_PERCENT, Math.round((this.#elapsedMs() / averageMs) * PERCENT_FULL));
  });

  readonly raceLink = computed(() => {
    const event = this.#store.event();

    return event === null ? null : `${RACE_PAGE_PREFIX}${event.dateIso}`;
  });

  protected readonly statuses = ResultStatus;
  protected readonly publishStates = PublishState;
  protected readonly adminLink = ADMIN_PAGE_LINK;

  /** Guards against a stale generation landing after a fast draft switch. */
  #showToken = 0;

  /** When the «Опубликовать» click happened; meaningful only while the wait is on. */
  #startedAtMs = 0;

  /** Marks Updating along the way; a heal back to Fresh after that means the poll gave up. */
  #deploySeen = false;
  #tickId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // A fresh batch must not inherit the publish state / pdf url of the previously published one.
    this.#github.reset();

    // Renders the active draft's protocol — on entry and on every page through the batch.
    effect(() => {
      const index = this.#store.activeIndex();

      void this.#showDraft(index);
    });

    // Ends the click-to-live wait: Updating marks the deploy as watched, Updated completes it
    // with a measured duration, a heal back to Fresh after Updating means the poll gave up.
    effect(() => {
      const state = this.#dbFreshness.state();

      if (!this.#waitingForDeploy() || this.deployDone()) {
        return;
      }

      if (state === DbFreshness.Updating) {
        this.#deploySeen = true;
      } else if (state === DbFreshness.Updated || (state === DbFreshness.Fresh && this.#deploySeen)) {
        this.#finishDeployWait(state === DbFreshness.Updated);
      }
    });
  }

  async share(): Promise<void> {
    const file = this.pdfFile();

    if (file !== null) {
      await this.#share.shareFile(file, this.#titleLine(), this.description());
    }
  }

  async copyDescription(): Promise<void> {
    this.copied.set(await this.#share.copyToClipboard(this.description()));
  }

  /** Publishes the whole batch as one atomic commit; the protocol PDFs are generated on the fly, never stored. */
  async publish(): Promise<void> {
    const inputs = this.#store.buildPublishInputs();

    if (inputs.length === 0) {
      return;
    }

    const startedAtMs = Date.now();

    await this.#github.publish(inputs);

    if (this.publishState() === PublishState.success) {
      // The archive db rebuild lags the commit, so mark every event pending — /admin shows them as «публикуется…».
      const atIso = new Date().toISOString();

      for (const input of inputs) {
        this.#pendingArchive.addUpload({
          slug: input.event.dateIso,
          number: input.event.number,
          dateIso: input.event.dateIso,
          participantCount: input.rows.length,
          atIso,
        });
      }

      this.#startedAtMs = startedAtMs;
      this.#waitingForDeploy.set(true);
      this.#tickId = setInterval(() => this.#elapsedMs.set(Date.now() - startedAtMs), PUBLISH_TICK_INTERVAL_MS);
      void this.#completeIfAlreadyLive();
    }
  }

  /** Remembers the run photo the organizer picked from the phone, so it rides along to VK. */
  onRunPhotoSelected(input: HTMLInputElement): void {
    this.#runPhoto.set(input.files?.[0] ?? null);
  }

  /**
   * Shares the protocol to VK as an inline photo: the PNG (rasterized from the pdf) plus the
   * optional run photo travel through the Web Share sheet straight into the VK app; where files
   * cannot be shared, the protocol image is downloaded and the VK dialog is opened for a manual attach.
   */
  async openVk(): Promise<void> {
    const image = await this.#protocolImageFile();

    if (image === null) {
      this.#share.openWindow(this.#share.buildVkShareUrl(location.origin, this.#titleLine()));

      return;
    }

    const runPhoto = this.#runPhoto();
    const files = runPhoto === null ? [image] : [image, runPhoto];

    if (this.#share.canShareFiles(files)) {
      await this.#share.shareFiles(files, this.#titleLine(), this.description());

      return;
    }

    triggerBlobDownload(this.#document, image, image.name);
    this.#share.openWindow(this.#share.buildVkShareUrl(location.origin, this.#titleLine()));
  }

  onDescriptionInput(value: string): void {
    this.description.set(value);

    const generated = this.#generated.get(this.#store.activeIndex());

    if (generated !== undefined) {
      generated.description = value;
    }
  }

  async back(): Promise<void> {
    await this.#router.navigate(PREVIEW_ROUTE_COMMANDS);
  }

  ngOnDestroy(): void {
    this.#stopTicking();

    for (const generated of this.#generated.values()) {
      URL.revokeObjectURL(generated.url);
    }
  }

  /**
   * The freshness probe is memoized from the publish flow's own check, so this costs no extra
   * request — it only catches the rare deploy that already landed before the page could watch it.
   */
  async #completeIfAlreadyLive(): Promise<void> {
    const ref = await this.#cdnRef.resolve();

    if (await this.#dbFreshness.pinnedDbAvailable(ref)) {
      this.#finishDeployWait(true);
    }
  }

  #finishDeployWait(measured: boolean): void {
    this.#stopTicking();
    this.deployDone.set(true);

    if (measured) {
      const durationMs = Date.now() - this.#startedAtMs;

      this.#publishedInMs.set(durationMs);
      this.#publishDuration.record(durationMs);
    }
  }

  #stopTicking(): void {
    if (this.#tickId !== null) {
      clearInterval(this.#tickId);
      this.#tickId = null;
    }
  }

  /** The protocol PNG, rasterized from the generated pdf once per draft and cached; null before generation. */
  async #protocolImageFile(): Promise<File | null> {
    const generated = this.#generated.get(this.#store.activeIndex());

    if (generated === undefined) {
      return null;
    }

    generated.imageBlob ??= await this.#protocolImage.render(generated.blob);

    return new File([generated.imageBlob], this.#imageFileName(), { type: PROTOCOL_IMAGE_MIME_TYPE });
  }

  /** Shows the draft's cached protocol, rendering it on the first visit; a stale render never lands. */
  async #showDraft(index: number): Promise<void> {
    const token = ++this.#showToken;
    const cached = this.#generated.get(index);

    this.copied.set(false);

    if (cached !== undefined) {
      this.#present(cached);

      return;
    }

    this.status.set(ResultStatus.generating);
    this.#blob.set(null);
    this.objectUrl.set(null);

    const generated = await this.#generate();

    if (generated !== null) {
      this.#generated.set(index, generated);
    }

    if (token !== this.#showToken) {
      return;
    }

    if (generated === null) {
      this.status.set(ResultStatus.error);

      return;
    }

    this.#present(generated);
  }

  #present(generated: GeneratedProtocol): void {
    this.#blob.set(generated.blob);
    this.objectUrl.set(generated.url);
    this.description.set(generated.description);
    this.status.set(ResultStatus.ready);
  }

  async #generate(): Promise<GeneratedProtocol | null> {
    const event = this.#store.event();

    if (event === null) {
      return null;
    }

    const rows = this.#store.protocolRows();

    try {
      const blob = await this.#pdf.generateProtocolBlob(
        event,
        rows,
        await this.#finishCounts(event.dateIso),
        await this.#previousBests(event.dateIso),
      );

      return { blob, url: URL.createObjectURL(blob), description: composeRaceAnnouncement(event, rows), imageBlob: null };
    } catch {
      return null;
    }
  }

  /**
   * The «Финишей» column source: the stored prior counts, the batch's earlier drafts and this
   * event's own finishes. A blank column beats a wrong count, so a failed db read drops the counts,
   * never the PDF.
   */
  async #finishCounts(dateIso: string): Promise<Record<string, number>> {
    try {
      const prior = finishCountsWithDrafts(await this.#results.loadFinishCountsBefore(dateIso), this.#store.draftRowsBefore(dateIso));

      return eventFinishCounts(this.#store.protocolRows(), prior);
    } catch {
      return {};
    }
  }

  /** Dates the «ЛР (было X)» notes, the batch's earlier drafts included; a failed db read drops the map, not the PDF. */
  async #previousBests(dateIso: string): Promise<Record<string, PreviousBest>> {
    try {
      return previousBestsWithDrafts(await this.#results.loadPreviousBestsBefore(dateIso), this.#store.draftRowsBefore(dateIso));
    } catch {
      return {};
    }
  }
}
