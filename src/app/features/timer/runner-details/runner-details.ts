import { Component, ElementRef, afterNextRender, computed, inject, input, output, signal } from '@angular/core';

import { formatRaceTime } from '../../../core/time/duration';
import { removeRunner, setRunnerOutcome, swapRunnerSplits } from '../../../core/timer/session-actions';
import { runnerSplitTimesMs } from '../../../core/timer/session-splits';
import { TimerRunnerOutcome, TimerRunnerOutcomeType } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { TIMER_CARD_FINISH_INDEX, TIMER_CARD_LAP_INDEX, TIMER_CARD_NO_TIME, TIMER_CARD_TIME_SEPARATOR } from './runner-details.constant';
import { TimerCardRunner } from './runner-details.interface';
import { cardRemoveNoteText } from './runner-details.text';
import { RaceTime } from '../../../shared/race-time/race-time';

/**
 * The card behind a long press on a tile (docs/TIMER.md §4): the two times of one runner, how his
 * race ended, and the two repairs a mistap needs — «поменять местами с…» when two tiles were tapped
 * the wrong way round, and removing somebody who should never have been on the roster.
 *
 * A card of its own rather than a strip on the page: it owns which swap target list is open, it owns
 * the question the deletion goes through, and it reads the measurement itself — so the times keep up
 * with the swap that has just been made instead of freezing at the moment the press happened.
 *
 * The one overlay of the feature that is deliberately NOT a `<dialog>`: it is a `role="group"` that
 * sits below the tab area rather than over it, so the tiles stay tappable while a mistake is being
 * repaired — a modal here would block the very screen the repair is checked against. The two things
 * a modal would have given for free are therefore done by hand: the host takes the focus when the
 * card opens, and Escape is listened for on the host, so it fires wherever inside the focus landed.
 */
@Component({
  selector: 'app-timer-runner-card',
  imports: [TimerConfirm, RaceTime],
  templateUrl: './runner-details.html',
  styleUrl: './runner-details.scss',
  host: {
    role: 'group',
    tabindex: '-1',
    '[attr.aria-label]': 'fullName()',
    '(keydown.escape)': 'onClose()',
  },
})
export class TimerRunnerCard {
  readonly #sessions = inject(TimerSessionService);
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #runner = computed(() => {
    const session = this.#sessions.active();

    return session?.runners.find((runner) => runner.id === this.runnerId()) ?? null;
  });

  readonly #timesMs = computed(() => {
    const session = this.#sessions.active();

    return session === null ? [] : runnerSplitTimesMs(session, this.runnerId());
  });

  readonly runnerId = input.required<string>();

  /** The card is done: closed by hand, by Escape, or because the runner it described is gone. */
  readonly close = output<void>();

  /** The list of swap targets is open — «тапнул не того» is a two-tap repair, not a one-tap trap. */
  readonly swapping = signal(false);

  /** The «Убрать из состава?» question in flight, with the runner and his times already in it. */
  readonly removeAsk = signal<string | null>(null);

  readonly fullName = computed(() => this.#runner()?.fullName ?? TIMER_CARD_NO_TIME);
  readonly outcome = computed(() => this.#runner()?.outcome ?? TimerRunnerOutcome.active);
  readonly lapText = computed(() => timeAt(this.#timesMs(), TIMER_CARD_LAP_INDEX));
  readonly finishText = computed(() => timeAt(this.#timesMs(), TIMER_CARD_FINISH_INDEX));

  /** Both times on one line — what the removal question puts next to the name. */
  readonly timesText = computed(() => joinTimes(this.#timesMs()));

  /** Everybody else on the roster, with what is written down for them — the swap needs both sides. */
  readonly others = computed<TimerCardRunner[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    return session.runners.reduce<TimerCardRunner[]>(
      (rows, runner) =>
        runner.id === this.runnerId()
          ? rows
          : [...rows, { fullName: runner.fullName, id: runner.id, timesText: timesText(session, runner.id) }],
      [],
    );
  });

  protected readonly outcomes = TimerRunnerOutcome;

  constructor() {
    // The card is opened by a long press on a tile or by a key in the journal, and until now the
    // focus stayed on whatever opened it — so Escape went to the page and the swap list was three
    // tabs away. The card itself takes the focus instead of its first button: a ring around «бежит»
    // reads as a chosen outcome, and this card exists to correct outcomes, not to suggest them.
    afterNextRender(() => this.#element.nativeElement.focus());
  }

  onClose(): void {
    this.close.emit();
  }

  /** «сошёл» / «только круг» / back into the race — the organiser's word, not a tap count. */
  onOutcome(outcome: TimerRunnerOutcomeType): void {
    this.#sessions.updateActive((session) => setRunnerOutcome(session, this.runnerId(), outcome));
  }

  onToggleSwap(): void {
    this.swapping.update((open) => !open);
  }

  /** Both runners exchange every time recorded for them: the classic «тапнул не того». */
  onSwap(otherId: string): void {
    this.swapping.set(false);
    this.#sessions.updateActive((session) => swapRunnerSplits(session, this.runnerId(), otherId));
  }

  onRemoveAsk(): void {
    this.removeAsk.set(cardRemoveNoteText(this.fullName(), this.timesText()));
  }

  /** Added by mistake: the tile goes and takes its times with it, so the card goes as well. */
  onRemove(): void {
    this.removeAsk.set(null);
    this.#sessions.updateActive((session) => removeRunner(session, this.runnerId()));
    this.close.emit();
  }
}

function timeAt(timesMs: readonly number[], index: number): string {
  const atMs = timesMs[index];

  return atMs === undefined ? TIMER_CARD_NO_TIME : formatRaceTime(atMs);
}

function timesText(session: TimerSession, runnerId: string): string {
  return joinTimes(runnerSplitTimesMs(session, runnerId));
}

/** «9:26 · 23:26», or a dash while nothing is written down for him yet. */
function joinTimes(timesMs: readonly number[]): string {
  return timesMs.length === 0 ? TIMER_CARD_NO_TIME : timesMs.map((atMs) => formatRaceTime(atMs)).join(TIMER_CARD_TIME_SEPARATOR);
}
