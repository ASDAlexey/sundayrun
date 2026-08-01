import { Component, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { isoToday } from '../../../core/time/iso-today';
import { TimerPublishState } from '../../../core/timer/timer-session.enum';
import { AdminTokenService } from '../../../github/admin-token.service';
import { TimerPublishService } from '../../../state/timer-publish.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { ADMIN_PAGE_LINK } from '../../admin/admin-page.constant';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { TIMER_ADMIN_RETURN_PARAMS } from '../session-publish/session-publish.constant';
import { TimerShare } from '../session-share/session-share';
import { TIMER_SESSIONS_NONE, TIMER_SESSIONS_TITLE_ID } from './session-list.constant';
import { TimerSessionRemove, TimerSessionRow } from './session-list.interface';
import { removeSessionNoteText } from './session-list.text';
import { buildTimerSessionRows } from './session-list.view';

/**
 * «Мои замеры» — every measurement this device ever took, newest first (docs/TIMER.md §8). The list
 * prunes nothing by itself: a race is data until its owner says otherwise, so «Удалить замер» is the
 * only way out and it goes through a question that names what disappears. Publishing spends nothing
 * either: a race sent to the site stays right here, and «Отправить забег» works over it a year later.
 *
 * The actions of a row live in a bottom sheet over the screen rather than inside the card: unfolded
 * in place they pushed the measurement off the top of the phone and turned a five-row list into a
 * scroll. The sheet is the same surface «Атлеты» uses (`styles/sheet`), because two languages of
 * surface in one feature is one too many.
 *
 * Getting the race out of the phone is one entrance and not two — `TimerShare` owns the workbook,
 * the chats and the preview of what it is about to send, and the finish screen opens the very same
 * sheet (§3, §8).
 */
@Component({
  selector: 'app-timer-sessions',
  imports: [RouterLink, TimerConfirm, TimerShare],
  templateUrl: './session-list.html',
  styleUrl: './session-list.scss',
})
export class TimerSessions {
  readonly #sessions = inject(TimerSessionService);
  readonly #publish = inject(TimerPublishService);
  readonly #adminToken = inject(AdminTokenService);

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

  /** Which measurement the «Отправить забег» sheet is open over; null while it is closed. */
  protected readonly sendId = signal<string | null>(null);
  protected readonly sendSession = computed(() => this.rows().find((row) => row.session.id === this.sendId())?.session ?? null);

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

  /** The workbook, the chats and the preview of the message, all in one sheet over the row. */
  protected onSend(row: TimerSessionRow): void {
    this.menuId.set(null);
    this.sendId.set(row.session.id);
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
}
