import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { isoToday } from '../../../core/time/iso-today';
import { sessionToParticipants } from '../../../core/timer/session-to-participants';
import { TimerPublishState } from '../../../core/timer/timer-session.enum';
import { buildTimerExportRows } from '../../../core/xlsx/timer-export-builder';
import { writeXlsxRows } from '../../../core/xlsx/xlsx-writer';
import { AdminTokenService } from '../../../github/admin-token.service';
import { triggerBlobDownload } from '../../../pdf/blob-download';
import { ShareService } from '../../../share/share.service';
import { TimerPublishService } from '../../../state/timer-publish.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { ADMIN_PAGE_LINK } from '../../admin/admin-page.constant';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { TIMER_ADMIN_RETURN_PARAMS } from '../session-publish/session-publish.constant';
import { TIMER_EXPORT_MIME_TYPE, TIMER_SESSIONS_NONE, TIMER_SESSIONS_TITLE_ID } from './session-list.constant';
import { TimerSessionRemove, TimerSessionRow } from './session-list.interface';
import { removeSessionNoteText } from './session-list.text';
import { buildTimerSessionRows } from './session-list.view';

/**
 * «Мои замеры» — every measurement this device ever took, newest first (docs/TIMER.md §8). The list
 * prunes nothing by itself: a race is data until its owner says otherwise, so «Удалить замер» is the
 * only way out and it goes through a question that names what disappears.
 *
 * The actions of a row live in a bottom sheet over the screen rather than inside the card: unfolded
 * in place they pushed the measurement off the top of the phone and turned a five-row list into a
 * scroll. The sheet is the same surface «Атлеты» uses (`styles/sheet`), because two languages of
 * surface in one feature is one too many.
 *
 * The workbook of «Экспорт в Excel» and «Поделиться» is built at the press and kept nowhere — the
 * archive gets the session itself, and a file only exists while it travels to a chat (§3, §8). Where
 * the Web Share sheet cannot carry files, the same bytes are simply downloaded.
 */
@Component({
  selector: 'app-timer-sessions',
  imports: [RouterLink, TimerConfirm],
  templateUrl: './session-list.html',
  styleUrl: './session-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerSessions {
  readonly #sessions = inject(TimerSessionService);
  readonly #publish = inject(TimerPublishService);
  readonly #adminToken = inject(AdminTokenService);
  readonly #share = inject(ShareService);
  readonly #document = inject(DOCUMENT);

  /** The measurement to reopen; the page decides how (`TimerSessionService.open`). */
  readonly open = output<string>();

  protected readonly states = TimerPublishState;
  protected readonly adminLink = ADMIN_PAGE_LINK;
  protected readonly adminReturnParams = TIMER_ADMIN_RETURN_PARAMS;
  protected readonly isAdmin = this.#adminToken.isAdmin;
  protected readonly sheetTitleId = TIMER_SESSIONS_TITLE_ID;
  protected readonly rows = computed(() => buildTimerSessionRows(this.#sessions.sessions()));
  protected readonly isEmpty = computed(() => this.rows().length === TIMER_SESSIONS_NONE);

  /** The row whose action sheet is open; only ever one at a time. */
  protected readonly menuId = signal<string | null>(null);
  protected readonly menuRow = computed(() => this.rows().find((row) => row.session.id === this.menuId()) ?? null);

  /** The «Удалить замер?» question in flight — the measurement and the words that name the loss. */
  protected readonly removeAsk = signal<TimerSessionRemove | null>(null);

  protected onNew(): void {
    this.#sessions.create({ dateIso: isoToday() });
  }

  protected onOpen(row: TimerSessionRow): void {
    this.menuId.set(null);
    this.open.emit(row.session.id);
  }

  protected onOpenMenu(row: TimerSessionRow): void {
    this.menuId.set(row.session.id);
  }

  protected onCloseMenu(): void {
    this.menuId.set(null);
  }

  protected onExport(row: TimerSessionRow): void {
    this.menuId.set(null);
    triggerBlobDownload(this.#document, this.#buildFile(row), row.fileName);
  }

  /** The system sheet where it exists; a browser without file sharing quietly saves the file instead. */
  protected async onShare(row: TimerSessionRow): Promise<void> {
    const file = this.#buildFile(row);

    this.menuId.set(null);

    if (this.#share.canShareFile(file)) {
      await this.#share.shareFile(file, row.dateText, row.metaText);

      return;
    }

    triggerBlobDownload(this.#document, file, row.fileName);
  }

  /** Publishing an already saved measurement: «сохраняли без сети» or simply changed their mind. */
  protected onPublish(row: TimerSessionRow): void {
    this.menuId.set(null);
    void this.#publish.publish(row.session);
  }

  /** The sheet stays open behind the question: «Отмена» has to land back where it was asked. */
  protected onRemoveAsk(row: TimerSessionRow): void {
    this.removeAsk.set({ id: row.session.id, note: removeSessionNoteText(row.dateText, row.metaText) });
  }

  protected onRemove(id: string): void {
    this.removeAsk.set(null);
    this.menuId.set(null);
    this.#sessions.remove(id);
  }

  /** The six-column workbook `parseTimerExport` reads back, assembled here and stored nowhere. */
  #buildFile(row: TimerSessionRow): File {
    const bytes = writeXlsxRows(buildTimerExportRows(sessionToParticipants(row.session)));

    // The copy is what makes the bytes a `BlobPart`: a zip writer hands back a view over an
    // `ArrayBufferLike`, which may be shared, and `File` only accepts a plain buffer.
    return new File([new Uint8Array(bytes)], row.fileName, { type: TIMER_EXPORT_MIME_TYPE });
  }
}
