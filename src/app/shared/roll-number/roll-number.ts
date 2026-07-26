import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

import { RollFrame, RollSlot } from './roll-number.interface';

/**
 * A number whose digits flip instead of being rewritten: the old character rides up and
 * fades, the new one arrives from below.
 *
 * Split per character on purpose. On a countdown only the last digit usually changes, and
 * flipping the whole group every second would read as noise rather than as a clock. Each
 * slot keeps its own history, so `29 → 28` moves one digit and leaves the other still.
 *
 * There is no timer and nothing to clean up: the outgoing frame is dropped the next time
 * that slot changes, so a slot never holds more than two nodes however long the page lives.
 */
@Component({
  selector: 'app-roll-number',
  templateUrl: './roll-number.html',
  styleUrl: './roll-number.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RollNumber {
  /** The number as text — already padded and formatted by the caller. */
  readonly value = input.required<string>();

  protected readonly slots = linkedSignal<string, RollSlot[]>({
    source: this.value,
    computation: (value, previous) => this.#roll(value, previous?.value ?? []),
  });

  #seq = 0;

  #roll(value: string, previous: RollSlot[]): RollSlot[] {
    return [...value].map((char, index) => this.#slot(previous[index], index, char));
  }

  #slot(previous: RollSlot | undefined, index: number, char: string): RollSlot {
    // A slot that was not on screen a moment ago — the number just grew a digit, or this
    // is the first render — has nothing to roll away from, so it simply appears.
    if (previous === undefined) {
      const live = this.#frame(char, false);

      return { index, live, frames: [live] };
    }

    if (previous.live.char === char) {
      return previous;
    }

    const live = this.#frame(char, true);

    // The outgoing frame is rebuilt with `enter: false`. It keeps its `seq`, so `@for` keeps
    // its DOM node and the exit transition runs — but it must shed the entrance keyframe it
    // arrived with, because an animation outranks a transition and the digit would replay
    // its arrival instead of riding up out of the slot.
    return { index, live, frames: [{ ...previous.live, enter: false }, live] };
  }

  #frame(char: string, enter: boolean): RollFrame {
    this.#seq += 1;

    return { seq: this.#seq, char, enter };
  }
}
