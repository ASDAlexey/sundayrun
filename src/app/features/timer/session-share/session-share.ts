import { Component, DOCUMENT, DestroyRef, computed, inject, input, output, signal } from '@angular/core';

import { buildSessionShareText } from '../../../core/timer/session-share-text';
import { sessionToParticipants } from '../../../core/timer/session-to-participants';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { buildTimerExportRows } from '../../../core/xlsx/timer-export-builder';
import { writeXlsxRows } from '../../../core/xlsx/xlsx-writer';
import { triggerBlobDownload } from '../../../pdf/blob-download';
import { ShareService } from '../../../share/share.service';
import { CANONICAL_SITE_BASE_URL } from '../../../shared/seo/canonical-link.constant';
import { TimerSheet } from '../handout-sheet/handout-sheet';
import { buildTimerSessionRow } from '../session-list/session-list.view';
import {
  TIMER_SHARE_COPIED_MARK,
  TIMER_SHARE_COPIED_MS,
  TIMER_SHARE_COPY_MARK,
  TIMER_SHARE_MIME_TYPE,
  TIMER_SHARE_RACE_PREFIX,
  TIMER_SHARE_TITLE_ID,
} from './session-share.constant';
import { sessionShareLabels, shareFileCaption } from './session-share.text';

/**
 * «Отправить забег» — the one place a measurement leaves the phone, opened from the finish screen
 * and from «Мои замеры» alike (docs/TIMER.md §8).
 *
 * Two shapes of the same race, because the destinations want different things. A workbook is what
 * the numbers travel in — it is the very file `/upload` reads back, so a race sent to a colleague
 * comes home as a protocol. Plain text is what a chat wants: Telegram and MAX are reached through a
 * share url, and a share url carries text and a link, never a file.
 *
 * Nothing here is stored. The workbook is assembled at the press and forgotten; the archive keeps the
 * measurement itself, and the sheet can be opened over it again tomorrow. That is the whole promise
 * of the card that opens it — sending a race away never spends it.
 */
@Component({
  selector: 'app-timer-share',
  imports: [TimerSheet],
  templateUrl: './session-share.html',
  styleUrl: './session-share.scss',
})
export class TimerShare {
  readonly #share = inject(ShareService);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);

  /**
   * The six-column workbook, built once per measurement and kept nowhere else. A `computed` rather
   * than a method: zipping it is real work, and both the «можно ли поделиться файлом» question and
   * the press that answers it want the same bytes.
   *
   * The copy is what makes them a `BlobPart` — a zip writer hands back a view over an
   * `ArrayBufferLike`, which may be shared, and `File` only accepts a plain buffer.
   */
  readonly #workbook = computed(() => {
    const bytes = writeXlsxRows(buildTimerExportRows(sessionToParticipants(this.session())));

    return new File([new Uint8Array(bytes)], this.row().fileName, { type: TIMER_SHARE_MIME_TYPE });
  });

  readonly session = input.required<TimerSession>();

  /** The published slug, when this measurement has a page of its own; null while it is local only. */
  readonly raceSlug = input<string | null>(null);

  readonly closed = output<void>();

  protected readonly titleId = TIMER_SHARE_TITLE_ID;

  /** «Скопировано» under the key that did it; back to its own label a couple of seconds later. */
  protected readonly copied = signal(false);
  protected readonly copyMark = computed(() => (this.copied() ? TIMER_SHARE_COPIED_MARK : TIMER_SHARE_COPY_MARK));

  protected readonly row = computed(() => buildTimerSessionRow(this.session()));

  /** Web Share with a file is an iOS and Android thing; a desktop browser quietly downloads instead. */
  protected readonly canShareFile = computed(() => this.#share.canShareFile(this.#workbook()));

  /** The published protocol's address, or the site's own when the race has not been sent up yet. */
  protected readonly link = computed(() => {
    const slug = this.raceSlug();

    return slug === null ? CANONICAL_SITE_BASE_URL : `${CANONICAL_SITE_BASE_URL}${TIMER_SHARE_RACE_PREFIX}${slug}`;
  });

  /**
   * The message as a chat shows it: the finish order, and the link at the foot of it. Only a real
   * page is worth linking to — the site root belongs in a message, not under one.
   */
  protected readonly messageText = computed(() => {
    const slug = this.raceSlug();

    return buildSessionShareText(
      { session: this.session(), url: slug === null ? null : this.link() },
      sessionShareLabels(this.row().dateText),
    );
  });

  /** Telegram takes the link as a parameter of its own, so the body must not repeat it. */
  protected readonly telegramText = computed(() =>
    buildSessionShareText({ session: this.session(), url: null }, sessionShareLabels(this.row().dateText)),
  );

  #copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.#destroyRef.onDestroy(() => this.#clearCopyTimer());
  }

  /** The system sheet — the only path that can carry the workbook itself into a chat. */
  protected async onShareFile(): Promise<void> {
    const row = this.row();

    if (this.canShareFile()) {
      await this.#share.shareFile(this.#workbook(), row.dateText, shareFileCaption(row.dateText, row.metaText));

      return;
    }

    this.onDownload();
  }

  protected onDownload(): void {
    triggerBlobDownload(this.#document, this.#workbook(), this.row().fileName);
  }

  protected onTelegram(): void {
    this.#share.openWindow(this.#share.buildTelegramShareUrl(this.link(), this.telegramText()));
  }

  protected onMax(): void {
    this.#share.openWindow(this.#share.buildMaxShareUrl(this.messageText()));
  }

  /** For everything neither of the two knows about — a work chat, a note, an SMS. */
  protected async onCopy(): Promise<void> {
    const done = await this.#share.copyToClipboard(this.messageText());

    if (!done) {
      return;
    }

    this.#clearCopyTimer();
    this.copied.set(true);
    this.#copyTimer = setTimeout(() => this.copied.set(false), TIMER_SHARE_COPIED_MS);
  }

  #clearCopyTimer(): void {
    if (this.#copyTimer !== null) {
      clearTimeout(this.#copyTimer);
      this.#copyTimer = null;
    }
  }
}
