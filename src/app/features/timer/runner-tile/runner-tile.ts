import { Component, computed, input, output, signal } from '@angular/core';

import { TimerRunnerStage, TimerRunnerStageType } from '../../../core/timer/timer-session.enum';
import { TimerRunner } from '../../../core/timer/timer-session.interface';
import { TimerTilePress, TimerTileTimeFrame } from './runner-tile.interface';
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
 * Every gesture is read off plain pointer events; `hammerjs` is in the project but stays out of the
 * hot path — one `pointerdown` handler is cheaper than a recogniser and the tap must land in the
 * same frame the finger does.
 *
 * `tap` fires on `pointerdown`, some 100 ms before a click would. A press that turns out to be a
 * swipe therefore cannot un-fire it, so a swipe always emits `undo` first to roll its own tap back,
 * and a leftward one then retires the runner on top of that. `details` needs the press to stay put,
 * so it can never race a swipe.
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

  readonly tap = output<void>();
  readonly retire = output<void>();
  readonly undo = output<void>();
  readonly details = output<void>();

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
  /** Zero or one frame: a new time changes the `track` key, so the fly-in plays from scratch. */
  protected readonly timeFrames = computed<TimerTileTimeFrame[]>(() =>
    this.timeText() === TIMER_TILE_NO_TIME ? [] : [{ text: this.timeText() }],
  );

  #press: TimerTilePress | null = null;
  #lastTapMs: number | null = null;

  /** The cut is taken here — `pointerdown` beats `click` by about 100 ms. */
  protected onPointerDown(event: PointerEvent): void {
    this.#press = { atMs: event.timeStamp, x: event.clientX, y: event.clientY };

    if (this.#isDoubleTap(event.timeStamp)) {
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

  /** A pointer the browser took away (a scroll took over) leaves the tap that already fired alone. */
  protected onPointerCancel(): void {
    this.#press = null;
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
