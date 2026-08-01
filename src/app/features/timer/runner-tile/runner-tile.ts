import { Component, computed, input, output, signal } from '@angular/core';

import { TimerRunnerStage, TimerRunnerStageType } from '../../../core/timer/timer-session.enum';
import { TimerRunner } from '../../../core/timer/timer-session.interface';
import { TimerTilePress, TimerTileTimeFrame } from './runner-tile.interface';
import { tileRemoveLabelText } from './runner-tile.text';
import {
  TIMER_DOUBLE_TAP_GUARD_MS,
  TIMER_SWIPE_MAX_DRIFT_PX,
  TIMER_SWIPE_MIN_PX,
  TIMER_SWIPE_RETIRE_DIRECTION,
  TIMER_TILE_LONG_PRESS_MS,
  TIMER_TILE_NO_TIME,
  TIMER_TILE_RIPPLE_ORIGIN,
} from './runner-tile.constant';

/**
 * One runner as one key of the instrument. Purely presentational: it holds no session state, knows
 * nothing about laps or finishes and says nothing about records — surname, first name and one time,
 * exactly as docs/TIMER.md §4 demands («плитка молчит»).
 *
 * Every gesture is read off plain pointer events, with no recogniser library behind them: one
 * `pointerdown` handler is cheaper than a recogniser and the tap must land in the same frame the
 * finger does. (`hammerjs` is in `allowedCommonJsDependencies` for `chartjs-plugin-zoom`, which
 * reaches for it transitively — nothing here has ever used it.)
 *
 * `tap` fires on `pointerdown`, some 100 ms before a click would. A press that turns out to be a
 * swipe therefore cannot un-fire it, so a swipe always emits `undo` first to roll its own tap back,
 * and a leftward one then retires the runner on top of that. `details` needs the press to stay put,
 * so it can never race a swipe.
 *
 * The browser can also take the press away before the finger lifts: from 33 runners the grid scrolls,
 * and the whole scroll surface is tiles, so the first vertical drag of a full field arrives here as a
 * `pointercancel` with a phantom lap already written. That press emits `cancel`, and the grid deletes
 * the one split it produced — an undo would take the newest split of the session instead, which after
 * a scroll is somebody else's.
 */
@Component({
  selector: 'app-timer-tile',
  templateUrl: './runner-tile.html',
  styleUrl: './runner-tile.scss',
})
export class TimerTile {
  readonly runner = input.required<TimerRunner>();
  readonly stage = input.required<TimerRunnerStageType>();
  readonly surname = input.required<string>();
  /** Empty when the dense layout hid it; the full name still reaches the screen reader. */
  readonly givenName = input.required<string>();
  /** Empty until the runner has a time; the node itself is then absent. */
  readonly timeText = input.required<string>();
  /** 1…15 — the personal ink stripe, `var(--chart-N)` picked by the name hash. */
  readonly accentIndex = input.required<number>();
  /**
   * Whether the tile carries its own «×». Before the mass start it does: a newcomer is typed in by
   * ear, and a misheard surname has to be undoable where it is seen — on the tile — and not only
   * behind a long press or two screens away in the roster sheet. Once the clock runs it goes: there
   * the same corner is a split waiting to be lost.
   */
  readonly removable = input(false);

  readonly tap = output<void>();
  /** This press wrote a split and then turned out to be a scroll: take exactly that split back. */
  readonly cancel = output<void>();
  readonly retire = output<void>();
  readonly undo = output<void>();
  readonly details = output<void>();
  readonly remove = output<void>();

  protected readonly stages = TimerRunnerStage;
  protected readonly tapX = signal(TIMER_TILE_RIPPLE_ORIGIN);
  protected readonly tapY = signal(TIMER_TILE_RIPPLE_ORIGIN);
  protected readonly rippleOn = signal(false);
  /**
   * The block class travels with the ink modifier in one binding: a static `class` next to `[class]`
   * is a duplicate attribute, and fifteen `[class.timer-tile_ink-N]` lines would be worse.
   */
  protected readonly tileClass = computed(() => `timer-tile timer-tile_ink-${this.accentIndex()}`);
  /** The label says the whole name even when the tile shows «Попов А.» or an ellipsised surname. */
  protected readonly fullName = computed(() => this.runner().fullName);
  protected readonly removeLabel = computed(() => tileRemoveLabelText(this.fullName()));
  /** Zero or one frame: a new time changes the `track` key, so the fly-in plays from scratch. */
  protected readonly timeFrames = computed<TimerTileTimeFrame[]>(() =>
    this.timeText() === TIMER_TILE_NO_TIME ? [] : [{ text: this.timeText() }],
  );

  #press: TimerTilePress | null = null;
  #lastTapMs: number | null = null;

  /** The cut is taken here — `pointerdown` beats `click` by about 100 ms. */
  protected onPointerDown(event: PointerEvent): void {
    const cutting = !this.#isDoubleTap(event.timeStamp);

    // The press remembers whether it cut, and not merely that it happened: a cancel may only undo
    // what this very press wrote.
    this.#press = { atMs: event.timeStamp, tapped: cutting, x: event.clientX, y: event.clientY };

    if (!cutting) {
      return;
    }

    this.#lastTapMs = event.timeStamp;
    this.tapX.set(`${Math.round(event.offsetX)}px`);
    this.tapY.set(`${Math.round(event.offsetY)}px`);
    this.rippleOn.set(true);
    this.tap.emit();
  }

  protected onPointerUp(event: PointerEvent): void {
    const press = this.#press;
    this.#press = null;

    if (press === null) {
      return;
    }

    const shiftX = event.clientX - press.x;

    if (Math.abs(shiftX) >= TIMER_SWIPE_MIN_PX && Math.abs(event.clientY - press.y) <= TIMER_SWIPE_MAX_DRIFT_PX) {
      this.#onSwipe(shiftX);

      return;
    }

    if (event.timeStamp - press.atMs >= TIMER_TILE_LONG_PRESS_MS) {
      this.details.emit();
    }
  }

  /**
   * The browser took the pointer away — a scroll took over, and the gesture was never a tap. The
   * split the press wrote 100 ms too early has to go back with it; a press the double-tap guard
   * swallowed wrote nothing, and staying silent for it is the whole point of the `tapped` flag.
   */
  protected onPointerCancel(): void {
    const press = this.#press;

    this.#press = null;

    if (press?.tapped) {
      this.cancel.emit();
    }
  }

  /** The long press must open our own card, not the platform's «скопировать» sheet. */
  protected onContextMenu(event: Event): void {
    event.preventDefault();
  }

  /** `pointerdown` never arrives from a keyboard, so Enter and Space cut through here instead. */
  protected onKeyCut(event: Event): void {
    event.preventDefault();
    this.rippleOn.set(true);
    this.tap.emit();
  }

  protected onRippleEnd(): void {
    this.rippleOn.set(false);
  }

  #onSwipe(shiftX: number): void {
    this.undo.emit();

    if (shiftX < TIMER_SWIPE_RETIRE_DIRECTION) {
      this.retire.emit();
    }
  }

  #isDoubleTap(atMs: number): boolean {
    const last = this.#lastTapMs;

    return last !== null && atMs - last < TIMER_DOUBLE_TAP_GUARD_MS;
  }
}
