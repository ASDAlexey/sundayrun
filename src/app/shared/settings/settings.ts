import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { HundredthsService } from '../../state/hundredths.service';
import { RaceTime } from '../race-time/race-time';
import { SETTINGS_SAMPLE_TIME } from './settings.constant';

/**
 * «Настройки» — how this device draws the site. The gear lives in the header next to «Выбери себя»
 * because the two are the same kind of thing: a pick remembered here and carried nowhere else, by
 * no link and to nobody. One switch for now — the hundredths (see `HundredthsService`) — and a card
 * shaped to take the next ones without moving what the reader has already learnt.
 *
 * A native `<dialog>`, like every sheet of the stopwatch: the platform draws the scrim, keeps the
 * focus inside, answers Escape and hands the focus back to the gear afterwards — no library and no
 * bytes in the shell for any of it. Closed by hand rather than merely unrendered: only `close()`
 * returns the focus to the button that opened the card.
 *
 * The sample under the label is a real `app-race-time`, so the switch shows its own effect right
 * under the thumb: no closing the card and going off to a protocol to see what changed. That is
 * also why the state is a switch and not a word — «выкл» has to be read, a thrown switch is seen.
 */
@Component({
  selector: 'app-settings',
  imports: [MatSlideToggleModule, RaceTime],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly #hundredths = inject(HundredthsService);

  /** Holds the gear lit while the card is up — the card floats free, the button keeps the tie. */
  readonly open = signal(false);
  readonly hundredthsShown = this.#hundredths.shown;

  protected readonly sampleTime = SETTINGS_SAMPLE_TIME;

  openCard(card: HTMLDialogElement): void {
    card.showModal();
    this.open.set(true);
  }

  closeCard(card: HTMLDialogElement): void {
    card.close();
    this.open.set(false);
  }

  /** A native dialog reports a click on its own backdrop as a click on the dialog element. */
  onBackdrop(event: MouseEvent, card: HTMLDialogElement): void {
    if (event.target === card) {
      this.closeCard(card);
    }
  }

  toggleHundredths(): void {
    this.#hundredths.toggle();
  }
}
