import { ChangeDetectionStrategy, Component, DOCUMENT, OnDestroy, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { composeRaceAnnouncement } from '../../core/share/race-announcement';
import { LINE_SEPARATOR } from '../../core/share/race-announcement.constant';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { AdminTokenService } from '../../github/admin-token.service';
import { PublishState } from '../../github/github-storage.enum';
import { GithubStorageService } from '../../github/github-storage.service';
import { triggerBlobDownload } from '../../pdf/blob-download';
import { PdfService } from '../../pdf/pdf.service';
import { ShareService } from '../../share/share.service';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { ADMIN_PAGE_LINK } from '../admin/admin-page.constant';
import { EMPTY_TEXT, EVENT_NUMBER_PREFIX, PDF_MIME_TYPE, SUMMARY_SEPARATOR } from './result-page.constant';
import { ResultStatus, ResultStatusType } from './result-page.enum';
import { PREVIEW_ROUTE_COMMANDS } from './result.guard.constant';

/** The /result page: renders the protocol PDF on entry, previews it and offers download, share, archive publish and VK repost. */
@Component({
  selector: 'app-result-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, RouterLink],
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
  readonly #adminToken = inject(AdminTokenService);
  readonly #document = inject(DOCUMENT);
  readonly #blob = signal<Blob | null>(null);

  /** The first announcement line doubles as the share/repost title. */
  readonly #titleLine = computed(() => this.description().split(LINE_SEPARATOR)[0]);

  readonly status = signal<ResultStatusType>(ResultStatus.generating);
  readonly description = signal(EMPTY_TEXT);
  readonly copied = signal(false);
  readonly objectUrl = signal<string | null>(null);
  readonly isAdmin = this.#adminToken.isAdmin;
  readonly publishState = this.#github.state;

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

  protected readonly statuses = ResultStatus;
  protected readonly publishStates = PublishState;
  protected readonly adminLink = ADMIN_PAGE_LINK;

  constructor() {
    // A fresh event must not inherit the publish state / pdf url of the previously published one.
    this.#github.reset();
    void this.#generate();
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

  /** Publishes the event as one atomic commit; the protocol PDF is generated on the fly, never stored. */
  async publish(): Promise<void> {
    const event = this.#store.event();
    const sourceFile = this.#store.sourceFile();
    const blob = this.#blob();

    if (event === null || sourceFile === null || blob === null) {
      return;
    }

    await this.#github.publish({
      event,
      rows: this.#store.protocolRows(),
      sourceXlsxBytes: sourceFile.bytes,
    });
  }

  /**
   * Shares the generated PDF to VK as a file: the Web Share sheet (where the file can travel) is
   * preferred, otherwise the pdf is downloaded and the VK dialog is opened so it can be attached by hand.
   */
  async openVk(): Promise<void> {
    const file = this.pdfFile();

    if (file !== null && this.#share.canShareFile(file)) {
      await this.#share.shareFile(file, this.#titleLine(), this.description());

      return;
    }

    const blob = this.#blob();

    if (blob !== null) {
      triggerBlobDownload(this.#document, blob, this.fileName());
    }

    this.#share.openWindow(this.#share.buildVkShareUrl(location.origin, this.#titleLine()));
  }

  onDescriptionInput(value: string): void {
    this.description.set(value);
  }

  async back(): Promise<void> {
    await this.#router.navigate(PREVIEW_ROUTE_COMMANDS);
  }

  ngOnDestroy(): void {
    const url = this.objectUrl();

    if (url !== null) {
      URL.revokeObjectURL(url);
    }
  }

  async #generate(): Promise<void> {
    const event = this.#store.event();

    if (event === null) {
      this.status.set(ResultStatus.error);

      return;
    }

    const rows = this.#store.protocolRows();

    this.description.set(composeRaceAnnouncement(event, rows));

    try {
      const blob = await this.#pdf.generateProtocolBlob(event, rows);

      this.#blob.set(blob);
      this.objectUrl.set(URL.createObjectURL(blob));
      this.status.set(ResultStatus.ready);
    } catch {
      this.status.set(ResultStatus.error);
    }
  }
}
