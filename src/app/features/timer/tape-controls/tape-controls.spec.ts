import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerSession } from '../../../core/timer/timer-session.interface';
import {
  KUZNETSOV_RUNNER_ID,
  POPOV_IGOR_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
  TIMER_SESSION,
  TIMER_SESSION_IDLE,
  TIMER_SESSION_LAP_COMPLETE,
  TIMER_SESSION_ONLY_QUEUE,
  TIMER_SESSION_STALE_QUEUE,
  TIMER_SESSION_WITHOUT_SPLITS,
} from '../../../core/timer/timer-session.mock';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { HapticsServiceMock, hapticsServiceMock } from '../../../state/haptics.service.mock';
import { TimerClockService } from '../../../state/timer-clock.service';
import { CLOCK_MOCK_NOW_MS, timerClockServiceMock } from '../../../state/timer-clock.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerTape } from './tape-controls';
import { TimerTapeMode } from './tape-controls.enum';
import {
  TAPE_FINISH_HEADING,
  TAPE_FINISH_ROW_META,
  TAPE_FINISH_ROW_NAMES,
  TAPE_FIRST_SPLIT_ID_TAIL,
  TAPE_LAP_HEADING,
  TAPE_LAP_ROW_META,
  TAPE_LAP_ROW_NAMES,
  TAPE_NEXT_TIME_TEXT,
  TAPE_NOBODY_LAP,
  TAPE_ONE_OPEN_REQUEST,
  TAPE_SECOND_SPLIT_ID_TAIL,
  TAPE_SESSION_TWO_LAPS,
  TAPE_TWO_LAP_ROW_NAMES,
} from './tape-controls.mock';

describe('TimerTape', () => {
  let sessions: TimerSessionServiceMock;
  let fixture: ComponentFixture<TimerTape>;
  let tape: TimerTape;
  let haptics: HapticsServiceMock;

  /** Runs the newest pure change the component handed to the store against a session of our choosing. */
  const applyLastChange = (session: TimerSession): TimerSession => {
    const calls = sessions.updateActive.mock.calls;

    return calls[calls.length - 1][0](session);
  };

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    haptics = hapticsServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerClockService, useValue: timerClockServiceMock() },
        { provide: HapticsService, useValue: haptics },
      ],
    });
    fixture = TestBed.createComponent(TimerTape);
    tape = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('records nameless times on the monotonic clock', () => {
    expect(tape.hasQueue(), 'no measurement is open, so there is no queue').toBe(false);
    expect(tape.runners()).toEqual([]);
    expect(tape.lapRows()).toEqual([]);
    expect(tape.canCut(), 'and there is nothing to cut into either').toBe(false);
    expect(tape.emptyText(), 'a closed sheet has no empty half to explain').toBeNull();

    tape.onCut();

    expect(sessions.updateActive).not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION_IDLE);
    tape.onCut();

    expect(sessions.updateActive, 'the core refuses a cut before the start, and so does the key').not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION);

    expect(tape.canCut(), 'but the race is under way — «ОТСЕЧКА» is live').toBe(true);

    tape.onCut();

    const cut = applyLastChange(TIMER_SESSION);
    const recorded = cut.splits[cut.splits.length - 1];

    expect(cut.splits).toHaveLength(TIMER_SESSION.splits.length + 1);
    expect(recorded.atMs).toBe(CLOCK_MOCK_NOW_MS);
    expect(recorded.runnerId, 'one man is still out on the lap, so the cut has one owner and is handed straight to him').toBe(
      KUZNETSOV_RUNNER_ID,
    );
    expect(recorded.id.endsWith(TAPE_FIRST_SPLIT_ID_TAIL)).toBe(true);
    expect(haptics.play, 'a nameless cut is answered like any other').toHaveBeenCalledExactlyOnceWith(TimerFeedback.lap);

    const keyEvent = new KeyboardEvent('keydown');
    const prevented = vi.spyOn(keyEvent, 'preventDefault');

    tape.onKeyCut(keyEvent);

    expect(prevented, 'a keyboard cut must not double as a click').toHaveBeenCalledOnce();
    expect(applyLastChange(TIMER_SESSION).splits.at(-1)?.id.endsWith(TAPE_SECOND_SPLIT_ID_TAIL)).toBe(true);

    sessions.active.set(TIMER_SESSION_ONLY_QUEUE);
    tape.onCut();

    expect(
      applyLastChange(TIMER_SESSION_ONLY_QUEUE).splits.at(-1)?.runnerId,
      'with the whole field still out on the lap the cut is a question, and it waits for a surname',
    ).toBeNull();
  });

  it('hands each half the times that can be its own, and closes a half it has served out', () => {
    const opened: boolean[] = [];

    tape.panelOpen.subscribe((open) => opened.push(open));
    sessions.active.set(TIMER_SESSION);

    expect(tape.lapWaiting(), 'one man of the roster has not been tapped at all').toBe(TAPE_LAP_ROW_NAMES.length);
    expect(tape.finishWaiting(), 'and one has his lap and nothing else').toBe(TAPE_FINISH_ROW_NAMES.length);
    expect(tape.heading(), 'a closed sheet has nothing to head').toBeNull();

    tape.onToggle(TimerTapeMode.lap);

    expect(tape.open()).toBe(true);
    expect(tape.heading()).toBe(TAPE_LAP_HEADING);
    expect(opened, 'the page gets the tiles out of the way while the sheet is up').toEqual([true]);
    expect(
      tape.runners().map((runner) => runner.fullName),
      'the finished and the retired are not greyed out — they are not in the list',
    ).toEqual(TAPE_LAP_ROW_NAMES);
    expect(tape.runners().map((runner) => runner.metaText)).toEqual(TAPE_LAP_ROW_META);
    expect(
      tape.runners().map((runner) => runner.timeText),
      'every row carries the time it is about to write',
    ).toEqual([TAPE_NEXT_TIME_TEXT]);

    tape.onToggle(TimerTapeMode.finish);

    expect(tape.mode(), 'the other key swaps the group without closing anything').toBe(TimerTapeMode.finish);
    expect(tape.heading()).toBe(TAPE_FINISH_HEADING);
    expect(opened).toEqual([true, true]);
    expect(tape.runners().map((runner) => runner.fullName)).toEqual(TAPE_FINISH_ROW_NAMES);
    expect(
      tape.runners().map((runner) => runner.metaText),
      'the lap he already has names him',
    ).toEqual(TAPE_FINISH_ROW_META);

    tape.onAssign(POPOV_IGOR_RUNNER_ID);

    const handed = applyLastChange(TIMER_SESSION).splits.find((split) => split.runnerId === POPOV_IGOR_RUNNER_ID && split.atMs > 0);

    expect(handed, 'the finish is written, and from the queue').toBeDefined();
    expect(haptics.play).toHaveBeenCalledWith(TimerFeedback.lap);
    expect(tape.open(), 'the half had one surname left, so the sheet is done with').toBe(false);
    expect(opened).toEqual([true, true, false]);

    tape.onToggle(TimerTapeMode.finish);
    tape.onToggle(TimerTapeMode.finish);

    expect(tape.open(), 'the same key twice closes the sheet').toBe(false);

    fixture.componentRef.setInput('openRequest', TAPE_ONE_OPEN_REQUEST);

    expect(tape.mode(), '«Разобрать» from the publish card lands where people are still awaited').toBe(TimerTapeMode.lap);
  });

  it('refuses a finish earlier than the runner’s own lap, and says so instead of showing him', () => {
    sessions.active.set(TIMER_SESSION_STALE_QUEUE);
    tape.onToggle(TimerTapeMode.finish);

    expect(tape.finishWaiting(), 'the queue holds nothing later than his lap — he is no target').toBe(0);
    expect(tape.runners()).toEqual([]);
    expect(tape.emptyText(), 'an empty half of a full queue says which half it is').toBeTruthy();

    sessions.active.set(TIMER_SESSION);
    tape.onToggle(TimerTapeMode.lap);
    tape.onAssign(KUZNETSOV_RUNNER_ID);

    const lap = applyLastChange(TIMER_SESSION).splits.find((split) => split.runnerId === KUZNETSOV_RUNNER_ID);

    expect(lap, 'a man with no taps at all takes the earliest time there is').toBeDefined();

    sessions.active.set(TIMER_SESSION_ONLY_QUEUE);
    tape.onToggle(TimerTapeMode.lap);
    tape.onAssign(KUZNETSOV_RUNNER_ID);

    expect(tape.open(), 'a half with people still in it stays open for the next surname').toBe(true);

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);

    expect(tape.emptyText(), 'an emptied queue says so before it says anything about the group').toBeTruthy();
    expect(tape.hasQueue()).toBe(false);

    sessions.active.set(TIMER_SESSION_LAP_COMPLETE);
    tape.onClose();
    tape.onToggle(TimerTapeMode.lap);

    expect(tape.emptyText(), 'the whole field is round — the queue can only be finishes now').toBe(TAPE_NOBODY_LAP);

    tape.onClose();
    fixture.componentRef.setInput('openRequest', TAPE_ONE_OPEN_REQUEST);

    expect(tape.mode(), 'with the whole field round, «Разобрать» lands on the finishes').toBe(TimerTapeMode.finish);
  });

  it('serves the surname a tap leaves alone, without asking for the tap', () => {
    sessions.active.set(TAPE_SESSION_TWO_LAPS);
    tape.onToggle(TimerTapeMode.lap);

    expect(
      tape.runners().map((runner) => runner.fullName),
      'two surnames wait for a lap time',
    ).toEqual(TAPE_TWO_LAP_ROW_NAMES);

    tape.onAssign(KUZNETSOV_RUNNER_ID);

    const served = applyLastChange(TAPE_SESSION_TWO_LAPS).splits.find((split) => split.runnerId === SOKOLOVA_RUNNER_ID);

    expect(sessions.updateActive, 'one tap, two handouts — the row it left alone went by itself').toHaveBeenCalledTimes(2);
    expect(served, 'and it went to the surname nobody else could have taken that time from').toBeDefined();
    expect(haptics.play, 'both handouts buzz, so the finger knows the second one happened').toHaveBeenCalledTimes(2);
    expect(tape.open(), 'the half is served out, so the sheet is done with').toBe(false);
  });

  it('opens the handout as a modal sheet and closes it on the backdrop, Escape and «Готово»', async () => {
    sessions.active.set(TIMER_SESSION);
    tape.onToggle(TimerTapeMode.lap);
    await fixture.whenStable();

    const element = fixture.nativeElement;
    const sheet = (): HTMLDialogElement | null => element.querySelector('.timer-tape__sheet');

    expect(sheet()?.open, 'the list is a modal, not a panel lost in the page').toBe(true);
    expect(element.querySelectorAll('.timer-tape__runner')).toHaveLength(TAPE_LAP_ROW_NAMES.length);
    expect(element.querySelector('.timer-tape__runner-time').textContent.trim()).toBe(TAPE_NEXT_TIME_TEXT);
    expect(element.querySelector('.timer-tape__sheet-title').textContent.trim()).toBe(TAPE_LAP_HEADING);

    sheet()?.dispatchEvent(new MouseEvent('click'));
    await fixture.whenStable();

    expect(sheet(), 'a click on the backdrop is a click on the dialog itself').toBeNull();

    tape.onToggle(TimerTapeMode.lap);
    await fixture.whenStable();
    sheet()?.dispatchEvent(new Event('cancel'));
    await fixture.whenStable();

    expect(sheet(), 'Escape closes it too').toBeNull();

    tape.onToggle(TimerTapeMode.lap);
    await fixture.whenStable();
    element.querySelector('.timer-tape__sheet-close').click();
    await fixture.whenStable();

    expect(sheet()).toBeNull();

    sessions.active.set(TIMER_SESSION_IDLE);
    await fixture.whenStable();

    expect(element.querySelector('.timer-tape__cut'), 'and «ОТСЕЧКА» is gone before the start, not greyed out').toBeNull();
  });
});
