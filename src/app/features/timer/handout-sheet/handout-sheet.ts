import { Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

/**
 * The handout list as a modal sheet. Same reasoning as the confirm dialog: the host *is* the
 * `<dialog>`, so the platform draws the backdrop, traps the focus and turns Escape into a `cancel`
 * event — and inline the list was simply lost between the publish card and the keys, which is how a
 * time ends up on the wrong surname.
 */
@Directive({
  selector: 'dialog[appTimerSheet]',
  host: {
    class: 'timer-sheet',
    '(cancel)': 'onDismiss()',
    '(click)': 'onBackdrop($event)',
  },
})
export class TimerSheet {
  readonly #element = inject<ElementRef<HTMLDialogElement>>(ElementRef);

  /** Escape, the backdrop or «Готово» — the caller only has to stop rendering the sheet. */
  readonly closed = output<void>();

  constructor() {
    afterNextRender(() => this.#element.nativeElement.showModal());
  }

  onDismiss(): void {
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
