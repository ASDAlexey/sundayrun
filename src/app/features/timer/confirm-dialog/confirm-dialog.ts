import { Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

import { TIMER_CONFIRM_TITLE_ID } from './confirm-dialog.constant';

/**
 * The one question the stopwatch asks before it destroys something. Five places call it — a deleted
 * measurement in «Мои замеры» and after «Стоп», the race reset, a discarded nameless time and a
 * deleted journal entry — with their own words, because «Вы уверены?» in the abstract tells nobody
 * what is about to be lost.
 *
 * It replaces the long-press ring of `docs/TIMER.md` §10: on the phone the ring neither read as an
 * affordance nor fired reliably (a tap did nothing and said nothing), and a modal that names the
 * damage is both faster to understand and impossible to trigger by a slip of the thumb.
 *
 * The host *is* the `<dialog>`, so `showModal()` needs no view query: the platform draws the
 * backdrop, traps the focus, puts it on «Отмена» — the safe key comes first in the DOM — hands it
 * back to whatever opened the question, and turns Escape into a `cancel` event.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- the host must be the <dialog> itself (see above)
  selector: 'dialog[appTimerConfirm]',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  host: {
    class: 'timer-confirm',
    '[attr.aria-labelledby]': 'titleId',
    '(cancel)': 'onDismiss()',
    '(click)': 'onBackdrop($event)',
  },
})
export class TimerConfirm {
  readonly #element = inject<ElementRef<HTMLDialogElement>>(ElementRef);

  /** «Удалить замер?» — what is being asked, in one line. */
  readonly heading = input.required<string>();

  /** What exactly disappears, with the real numbers of this measurement, and that it is final. */
  readonly note = input.required<string>();

  /** The label of the destructive key: «Удалить замер», «Сбросить времена», «Выбросить». */
  readonly actionLabel = input.required<string>();

  readonly confirmed = output<void>();

  /** Escape, the backdrop or «Отмена» — the caller only has to forget it ever asked. */
  readonly closed = output<void>();

  protected readonly titleId = TIMER_CONFIRM_TITLE_ID;

  constructor() {
    afterNextRender(() => this.#element.nativeElement.showModal());
  }

  protected onConfirm(): void {
    this.#element.nativeElement.close();
    this.confirmed.emit();
  }

  protected onDismiss(): void {
    this.#element.nativeElement.close();
    this.closed.emit();
  }

  /** A native dialog reports a click on its backdrop as a click on the dialog element itself. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.#element.nativeElement) {
      this.onDismiss();
    }
  }
}
