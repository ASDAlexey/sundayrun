import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, linkedSignal, signal } from '@angular/core';

import { resumeSession, undoLastSplit } from '../../core/timer/session-actions';
import { clearRoster, resetSession } from '../../core/timer/session-reset';
import { unassignedSplits } from '../../core/timer/session-splits';
import { TimerStatus } from '../../core/timer/timer-session.enum';
import { TimerSession } from '../../core/timer/timer-session.interface';
import { HapticsService } from '../../state/haptics.service';
import { RaceGuardService } from '../../state/race-guard.service';
import { TimerRosterService } from '../../state/timer-roster.service';
import { TimerSessionService } from '../../state/timer-session.service';
import { TimerConfirm } from './confirm-dialog/confirm-dialog';
import { TimerFinishBoard } from './finish-board/finish-board';
import { TimerInstall } from './install-prompt/install-prompt';
import { TimerLapBoard } from './lap-board/lap-board';
import { TimerRaceKey } from './race-key/race-key';
import { TimerRunnerCard } from './runner-details/runner-details';
import { TimerGrid } from './runner-grid/runner-grid';
import { TimerTileView } from './runner-grid/runner-grid.interface';
import { TimerPicker } from './runner-picker/runner-picker';
import { TimerClock } from './session-clock/session-clock';
import { TimerHistory } from './session-history/session-history';
import { TimerSessions } from './session-list/session-list';
import { TimerPublish } from './session-publish/session-publish';
import { TimerTape } from './tape-controls/tape-controls';
import { TimerAnnouncementKind } from './timer-announcement.enum';
import { TimerAnnouncement } from './timer-announcement.interface';
import { TimerFarewellService } from './timer-farewell.service';
import { TIMER_FIRST_QUEUE_REQUEST, TIMER_PANEL_ID, TIMER_TAB_IDS } from './timer-page.constant';
import { TimerTab, TimerTabType } from './timer-page.enum';
import { clearRosterNoteText, resetNoteText, toggleStateText } from './timer-page.text';
import { buildTimerHeader } from './timer-page.view';

/**
 * The route. Without an open measurement it is an ordinary page of the site — a heading and «Мои
 * замеры». With one it becomes the cockpit: `position: fixed`, over the site header and footer, so the
 * grid arithmetic gets all 844 px of the phone it was calculated for (design spec §2.1). That makes
 * «←» the only way out, which is why it is the first control in the tab order and never disabled.
 *
 * All UI state of the screen lives here — the open tab, the «⋮» menu, the roster sheet, the journal
 * and which runner's card is up — while every fact about the race stays in `TimerSessionService`.
 * Grid density is not among them: it follows the size of the field and is nobody's decision (§14).
 */
@Component({
  selector: 'app-timer',
  imports: [
    TimerClock,
    TimerConfirm,
    TimerFinishBoard,
    TimerGrid,
    TimerHistory,
    TimerInstall,
    TimerLapBoard,
    TimerPicker,
    TimerPublish,
    TimerRaceKey,
    TimerRunnerCard,
    TimerSessions,
    TimerTape,
  ],
  templateUrl: './timer-page.html',
  styleUrl: './timer-page.scss',
})
export class TimerPage {
  readonly #sessions = inject(TimerSessionService);
  readonly #roster = inject(TimerRosterService);
  readonly #haptics = inject(HapticsService);
  readonly #raceGuard = inject(RaceGuardService);
  readonly #farewell = inject(TimerFarewellService);

  protected readonly tabs = TimerTab;
  protected readonly tabIds = TIMER_TAB_IDS;
  protected readonly panelId = TIMER_PANEL_ID;
  protected readonly kinds = TimerAnnouncementKind;
  protected readonly statuses = TimerStatus;
  protected readonly session = this.#sessions.active;
  protected readonly header = computed(() => buildTimerHeader(this.#sessions.active()));
  protected readonly soundEnabled = this.#haptics.soundEnabled;

  /** The tiles are going out in a wave; the grid has to stay on screen until they have. */
  protected readonly farewellWave = this.#farewell.waving;

  /**
   * A plain choice of tab, with one exception: when the wave of «последний финишировавший» has run
   * its course the protocol comes up by itself. A `linkedSignal` rather than an effect, because the
   * switch has to happen exactly on the edge — an organiser who then goes back to the tiles must not
   * be dragged to the protocol again on the next repaint.
   */
  protected readonly tab = linkedSignal<boolean, TimerTabType>({
    source: () => this.#farewell.settled(),
    computation: (settled, previous) => (settled && previous?.source === false ? TimerTab.finish : (previous?.value ?? TimerTab.grid)),
  });

  protected readonly soundStateText = computed(() => toggleStateText(this.soundEnabled()));

  /** The «Сбросить забег?» question in flight — the words are built while the race is in hand. */
  protected readonly resetAsk = signal<string | null>(null);

  /** The same, for «Очистить состав?» — the minute before the start has nothing else to undo. */
  protected readonly clearAsk = signal<string | null>(null);
  protected readonly menuOpen = signal(false);
  protected readonly pickerOpen = signal(false);
  protected readonly historyOpen = signal(false);
  protected readonly announcement = signal<TimerAnnouncement | null>(null);

  /**
   * Which tab the area below is actually showing — and nothing at all while the journal is up. The
   * journal is a modal that covers the whole screen and makes the strip behind it inert without
   * touching `tab()`, so `tab()` alone answers «куда я вернусь», not «что сейчас на экране»; only the
   * second question is what `aria-selected` asks, and a strip claiming «Финиш» from under an open
   * journal misleads a reader worse than no roles would.
   */
  protected readonly selectedTab = computed<TimerTabType | null>(() => (this.historyOpen() ? null : this.tab()));

  /** The panel is named by the tab it shows; the journal that covers it brings its own dialog label. */
  protected readonly panelLabelId = computed(() => {
    const selected = this.selectedTab();

    return selected === null ? null : TIMER_TAB_IDS[selected];
  });

  /** Whose card is up: the id rather than the tile view, so the times follow every later fix. */
  protected readonly detailsId = signal<string | null>(null);

  /** How many times the handout panel has been asked for from the outside; the tape watches this. */
  protected readonly queueRequest = signal(TIMER_FIRST_QUEUE_REQUEST);

  /**
   * Whether the bottom bar has anything left to do. After «Стоп» it usually does not: «ОТСЕЧКА» is
   * dead by the core's own rule, and a dead key plus the line explaining why costs a phone a hundred
   * pixels of the protocol at the exact moment the protocol is the screen. It survives the finish for
   * one reason only — nameless times still waiting for a surname are handed out from this very panel.
   */
  protected readonly tapeNeeded = computed(() => {
    const session = this.session();

    return session !== null && (session.status !== TimerStatus.finished || unassignedSplits(session).length > 0);
  });

  constructor() {
    // The directory feeds the tile order, so it is warmed up the moment the route opens. The
    // prerender worker skips it: the static HTML is the empty state, and its db has no roster to add.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#roster.load();
    }
  }

  protected onOpenSession(id: string): void {
    this.#sessions.open(id);
  }

  /**
   * Back to «Мои замеры»; the measurement keeps running, it is only no longer on screen. Because the
   * cockpit covers the site header, this is the one visible way out — so mid-race it costs the same
   * confirmation the route guard asks of the system «назад».
   */
  protected onBack(): void {
    if (this.#raceGuard.confirmLeave()) {
      this.#sessions.closeActive();
    }
  }

  /**
   * «Отменить» takes the newest tap back — and with it the finish of the race, if that tap is what
   * ended it. The clock stops itself once everybody is home (docs/TIMER.md §14), so a misstap on the
   * last runner would otherwise leave the measurement stopped with people still out on the course and
   * the core refusing every further split. Undo puts it back on the clock; the digits catch up by
   * themselves, because the start stamp never moved.
   */
  protected onUndoLast(): void {
    this.#sessions.updateActive((session) => resumeSession(undoLastSplit(session)));
  }

  protected onTab(tab: TimerTabType): void {
    this.tab.set(tab);
    this.historyOpen.set(false);
  }

  /**
   * The click is the iPhone's stand-in for a buzz it will never feel (docs/TIMER.md §10). Toggled
   * from this very tap and nowhere else: a browser only lets an `AudioContext` be born inside a
   * user gesture, and the menu item is the one gesture that is not a split.
   */
  protected onToggleSound(): void {
    this.#haptics.toggleSound();
  }

  protected onToggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected onPicker(): void {
    this.menuOpen.set(false);
    this.pickerOpen.set(true);
  }

  protected onHistory(): void {
    this.menuOpen.set(false);
    this.historyOpen.set(true);
  }

  protected onAnnounce(announcement: TimerAnnouncement): void {
    this.announcement.set(announcement);
  }

  protected onDetails(view: TimerTileView): void {
    this.onCard(view.runner.id);
  }

  /**
   * The same card, asked for by surname instead of by a long press on the right tile. «Поменять
   * местами с…» lives only in that card and is the only repair for the commonest mistake of the
   * cockpit — a tap on the neighbouring name — so it must not depend on a gesture that has to be
   * both long enough and still enough.
   *
   * The journal goes when the card comes, and it has to: the journal is a modal `<dialog>`, and the
   * card sits below the tab area, which a modal makes inert — left open, it would bury the very card
   * it was asked for. The way back is one item of the «⋮» menu, and it reopens on the same journal.
   */
  protected onCard(runnerId: string): void {
    this.historyOpen.set(false);
    this.detailsId.set(runnerId);
  }

  protected onCloseDetails(): void {
    this.detailsId.set(null);
  }

  /**
   * The open queue costs the grid a row (design §2.2) and that is deliberately all it costs: making the
   * tiles denser mid-race would move them under a finger that already knows where they are (§8.6). So
   * instead of re-laying the grid out, the page simply makes sure the tiles are the thing on screen —
   * a queue is handed out by tapping surnames, not by reading a protocol — and gets the runner card out
   * of the way, because both it and the panel live in the same bottom rows.
   */
  protected onTapePanel(open: boolean): void {
    if (open) {
      this.tab.set(TimerTab.grid);
      this.historyOpen.set(false);
      this.detailsId.set(null);
    }
  }

  /** «Разобрать» on the publish card: the organiser is taken to the queue instead of being told about it. */
  protected onQueue(): void {
    this.onTapePanel(true);
    this.queueRequest.update((request) => request + 1);
  }

  /** The question spells out the difference from «Удалить замер»: the people stay, the times go. */
  protected onResetAsk(session: TimerSession): void {
    this.resetAsk.set(resetNoteText(session.runners.length, session.splits.length));
  }

  /** Wipes the times and keeps the roster, once the question has been answered. */
  protected onReset(): void {
    this.resetAsk.set(null);
    this.#sessions.updateActive(resetSession);
    this.menuOpen.set(false);
  }

  /** And its mirror: the question names the people, because they are all that is at stake here. */
  protected onClearAsk(session: TimerSession): void {
    this.clearAsk.set(clearRosterNoteText(session.runners.length));
  }

  /** Empties the line-up and leaves the measurement; the roster sheet is the way back. */
  protected onClear(): void {
    this.clearAsk.set(null);
    this.#sessions.updateActive(clearRoster);
    this.menuOpen.set(false);
  }
}
