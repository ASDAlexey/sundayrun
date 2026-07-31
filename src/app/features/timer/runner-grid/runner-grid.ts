import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { formatRaceTime } from '../../../core/time/duration';
import { recordSplit, removeRunner, removeSplit, setRunnerOutcome } from '../../../core/timer/session-actions';
import { handOutSoleLapSplit } from '../../../core/timer/session-auto-handout';
import { hasDuplicateSurnames } from '../../../core/timer/session-splits';
import { createTimerId } from '../../../core/timer/timer-id';
import { TimerRunnerStage, TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerAnnouncementKind } from '../timer-announcement.enum';
import { TimerAnnouncement } from '../timer-announcement.interface';
import { TimerTile } from '../runner-tile/runner-tile';
import { removeNewestSplit, retireOutcome } from './grid-transitions';
import { resolveTimerDensity } from './tile-layout';
import { orderTimerTileIds } from './tile-order';
import { buildTimerTileViews } from './tile-view';
import {
  TIMER_DRAG_START_DELAY_MS,
  TIMER_QUIET_BEFORE_RELAYOUT_MS,
  TIMER_SCROLL_MIN_RUNNERS,
  TIMER_SHELF_MIN_RUNNERS,
  TIMER_TILE_EMPTY_TIME,
  TIMER_UNDO_WINDOW_MS,
} from './runner-grid.constant';
import { TimerDensity } from './runner-grid.enum';
import { TimerLastTap, TimerTileOrderSource, TimerTileView } from './runner-grid.interface';
import { RaceTime } from '../../../shared/race-time/race-time';

/**
 * The keyboard of the instrument: every runner on one screen, in an order that stops moving the
 * moment the clock starts (docs/TIMER.md §4). The grid owns the three decisions a tile must not
 * know about — how dense the layout is, whether a repeat tap adds a time or takes the last one
 * back, and when it is quiet enough to move a finished runner out of the way.
 */
@Component({
  selector: 'app-timer-grid',
  imports: [CdkDrag, CdkDragPlaceholder, CdkDropList, TimerTile, RaceTime],
  templateUrl: './runner-grid.html',
  styleUrl: './runner-grid.scss',
})
export class TimerGrid {
  readonly #sessions = inject(TimerSessionService);
  readonly #clock = inject(TimerClockService);
  readonly #roster = inject(TimerRosterService);
  readonly #haptics = inject(HapticsService);
  readonly #lastTap = signal<TimerLastTap | null>(null);
  readonly #manualOrder = signal(false);
  readonly #status = computed(() => this.#sessions.active()?.status ?? null);
  readonly #runners = computed(() => this.#sessions.active()?.runners ?? []);
  /**
   * A linked signal rather than a plain computed on purpose: while the race runs the previous value
   * is the source of truth and the archive estimate is ignored, so muscle memory survives both a
   * latecomer joining and a hand-made arrangement.
   */
  readonly #orderedIds = linkedSignal<TimerTileOrderSource, string[]>({
    source: () => ({
      expectedLapMs: this.#roster.expectedLapMs(),
      frozen: this.#status() !== TimerStatus.idle || this.#manualOrder(),
      runners: this.#runners(),
    }),
    computation: (source, previous) => orderTimerTileIds(source, previous?.value),
  });

  /** Namesakes get their first names spelled out whatever the density — «Попов А.» twice is useless. */
  readonly #spellGiven = computed(() => {
    const density = this.resolvedDensity();

    return density === TimerDensity.large || density === TimerDensity.medium || hasDuplicateSurnames(this.#runners());
  });

  // The order is read before the guard on purpose: it has to stay in step with the roster even while
  // «Мои замеры» is on screen, so that reopening a measurement does not shuffle the tiles.
  readonly #views = computed(() => {
    const orderedIds = this.#orderedIds();
    const session = this.#sessions.active();

    return session === null ? [] : buildTimerTileViews(session, orderedIds, this.#spellGiven());
  });

  /** Nothing moves under a busy finger: the shelf waits for three seconds of silence. */
  readonly #shelved = computed(() => {
    const last = this.#lastTap();
    const quiet = last === null || this.#clock.elapsedMs() - last.atMs >= TIMER_QUIET_BEFORE_RELAYOUT_MS;

    return quiet && this.runnerCount() >= TIMER_SHELF_MIN_RUNNERS;
  });

  /** The last runner is home: the tiles go out in a wave and hand the screen to the protocol. */
  readonly farewell = input(false);

  readonly announce = output<TimerAnnouncement>();
  readonly details = output<TimerTileView>();

  protected readonly densities = TimerDensity;
  protected readonly dragStartDelayMs = TIMER_DRAG_START_DELAY_MS;
  protected readonly runnerCount = computed(() => this.#runners().length);
  /** The field size is the whole input: the grid tightens itself, nobody chooses (docs/TIMER.md §14). */
  protected readonly resolvedDensity = computed(() => resolveTimerDensity(this.runnerCount()));
  protected readonly scrolling = computed(() => this.runnerCount() >= TIMER_SCROLL_MIN_RUNNERS);
  protected readonly recording = computed(() => this.#status() === TimerStatus.running);
  /**
   * Reordering by hand and removing a person both belong to the minute before the start: during the
   * race a drag is a misstap, and a «×» under the thumb is a lost split and the man it belonged to.
   */
  protected readonly draggable = computed(() => this.#status() === TimerStatus.idle);
  protected readonly removable = this.draggable;
  protected readonly tiles = computed(() =>
    this.#shelved() ? this.#views().filter((view) => view.stage !== TimerRunnerStage.finished) : this.#views(),
  );

  protected readonly shelfTiles = computed(() =>
    this.#shelved() ? this.#views().filter((view) => view.stage === TimerRunnerStage.finished) : [],
  );

  /** A tap on a tile: first time is the 2.3 km lap, second the finish, a quick repeat takes it back. */
  protected onTap(view: TimerTileView): void {
    const atMs = this.#clock.nowMs();

    if (this.#undoRecent(view, atMs)) {
      return;
    }

    if (!this.recording() || view.stage === TimerRunnerStage.finished || view.stage === TimerRunnerStage.retired) {
      // Twice sharply: the tap was refused, and a thumb has to learn that without looking down.
      this.#haptics.play(TimerFeedback.error);

      return;
    }

    const splitId = createTimerId(atMs, () => Math.random());
    const finishing = view.stage === TimerRunnerStage.waitingFinish;

    // The tap that gives the second-to-last man his lap leaves exactly one runner out on the course:
    // whatever is queued nameless is then his, and the core hands it over without being asked.
    this.#sessions.updateActive((current) => handOutSoleLapSplit(recordSplit(current, view.runner.id, atMs, splitId)));
    this.#lastTap.set({ atMs, runnerId: view.runner.id, splitId });
    this.#haptics.play(finishing ? TimerFeedback.finish : TimerFeedback.lap);
    this.announce.emit({
      kind: finishing ? TimerAnnouncementKind.finish : TimerAnnouncementKind.lap,
      name: view.runner.fullName,
      timeText: formatRaceTime(atMs),
    });
  }

  /**
   * Swipe right, and the rollback half of a swipe left; the same handler returns a runner from the
   * shelf. The tap already fired on `pointerdown` and cannot be un-fired, so the gesture's first
   * duty is to remove whatever it has just written.
   */
  protected onUndo(view: TimerTileView): void {
    const last = this.#lastTap();
    const timeText = last !== null && last.runnerId === view.runner.id ? formatRaceTime(last.atMs) : view.timeText;

    this.#lastTap.set(null);
    this.#sessions.updateActive((current) => removeNewestSplit(current, view.runner.id));

    if (timeText !== TIMER_TILE_EMPTY_TIME) {
      this.#haptics.play(TimerFeedback.cancel);
      this.announce.emit({ kind: TimerAnnouncementKind.undo, name: view.runner.fullName, timeText });
    }
  }

  /** Swipe left: «сошёл». The tile keeps its place, greyed out and struck through. */
  protected onRetire(view: TimerTileView): void {
    this.#sessions.updateActive((current) => setRunnerOutcome(current, view.runner.id, retireOutcome(current, view.runner.id)));
  }

  protected onDetails(view: TimerTileView): void {
    this.details.emit(view);
  }

  /**
   * The «×» of the minute before the start: a surname misheard at the sign-up table, a newcomer
   * typed in twice. No question is asked — nothing has been timed yet, and the roster sheet puts
   * the person back in one tap, so a confirmation here would only cost the organiser a second in
   * the cold for a mistake that costs nothing.
   */
  protected onRemove(view: TimerTileView): void {
    this.#sessions.updateActive((current) => removeRunner(current, view.runner.id));
  }

  /** One drag before the start, so the fast runners can sit under the thumb. */
  protected onDropped(event: CdkDragDrop<TimerTileView[]>): void {
    const order = [...this.#orderedIds()];

    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.#orderedIds.set(order);
    this.#manualOrder.set(true);
  }

  /** A repeat tap inside the undo window cancels the record instead of adding the next one. */
  #undoRecent(view: TimerTileView, atMs: number): boolean {
    const last = this.#lastTap();

    if (last?.runnerId !== view.runner.id || atMs - last.atMs > TIMER_UNDO_WINDOW_MS) {
      return false;
    }

    this.#lastTap.set(null);
    this.#sessions.updateActive((current) => removeSplit(current, last.splitId));
    this.#haptics.play(TimerFeedback.cancel);
    this.announce.emit({ kind: TimerAnnouncementKind.undo, name: view.runner.fullName, timeText: formatRaceTime(last.atMs) });

    return true;
  }
}
