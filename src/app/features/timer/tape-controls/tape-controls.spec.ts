import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerSession } from '../../../core/timer/timer-session.interface';
import {
  FIRST_UNNAMED_SPLIT_ID,
  KUZNETSOV_RUNNER_ID,
  SECOND_UNNAMED_SPLIT_ID,
  SECOND_UNNAMED_SPLIT_MS,
  TIMER_SESSION,
  TIMER_SESSION_IDLE,
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
import {
  TAPE_FIRST_SPLIT_ID_TAIL,
  TAPE_IDLE_HINT,
  TAPE_ONE_OPEN_REQUEST,
  TAPE_QUEUE_TIME_TEXTS,
  TAPE_REPEAT_HINT,
  TAPE_RUNNER_META_TEXTS,
  TAPE_RUNNER_TAKEN_FLAGS,
  TAPE_SECOND_SPLIT_ID_TAIL,
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

  it('records nameless times on the monotonic clock and repeats the newest journal entry', () => {
    expect(tape.queue(), 'no measurement is open, so there is no queue').toEqual([]);
    expect(tape.runners()).toEqual([]);
    expect(tape.canRepeat(), 'nothing recorded yet — «+ ещё один» has no time to reuse').toBe(false);
    expect(tape.canCut(), 'and there is nothing to cut into either').toBe(false);
    expect(tape.keysHint(), 'a dead panel says why it is dead').toBe(TAPE_IDLE_HINT);

    tape.onRepeat();
    tape.onCut();

    expect(sessions.updateActive).not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION_IDLE);
    tape.onCut();

    expect(sessions.updateActive, 'the core refuses a cut before the start, and so does the key').not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);

    expect(tape.canRepeat(), 'an empty journal still has nothing to repeat').toBe(false);
    expect(tape.canCut(), 'but the race is under way — «ОТСЕЧКА» is live').toBe(true);
    expect(tape.keysHint(), 'so the line explains what the second key is for').toBe(TAPE_REPEAT_HINT);

    sessions.active.set(TIMER_SESSION);

    expect(tape.keysHint(), 'with a journal behind it the panel needs no explaining').toBeNull();

    tape.onCut();

    const cut = applyLastChange(TIMER_SESSION);
    const recorded = cut.splits[cut.splits.length - 1];

    expect(cut.splits).toHaveLength(TIMER_SESSION.splits.length + 1);
    expect(recorded.atMs).toBe(CLOCK_MOCK_NOW_MS);
    expect(recorded.runnerId, 'the cut goes into the queue, not onto a runner').toBeNull();
    expect(recorded.id.endsWith(TAPE_FIRST_SPLIT_ID_TAIL)).toBe(true);
    expect(haptics.play, 'a nameless cut is answered like any other').toHaveBeenCalledExactlyOnceWith(TimerFeedback.lap);

    const keyEvent = new KeyboardEvent('keydown');
    const prevented = vi.spyOn(keyEvent, 'preventDefault');

    tape.onKeyCut(keyEvent);

    expect(prevented, 'a keyboard cut must not double as a click').toHaveBeenCalledOnce();
    expect(applyLastChange(TIMER_SESSION).splits.at(-1)?.id.endsWith(TAPE_SECOND_SPLIT_ID_TAIL)).toBe(true);

    expect(tape.canRepeat()).toBe(true);

    tape.onRepeat();

    expect(applyLastChange(TIMER_SESSION).splits.at(-1)?.atMs, 'chest to chest: the newest time again').toBe(SECOND_UNNAMED_SPLIT_MS);
  });

  it('hands the queue out in order, or gives away the chip picked by hand', () => {
    sessions.active.set(TIMER_SESSION);

    expect(tape.queue().map((chip) => chip.timeText)).toEqual(TAPE_QUEUE_TIME_TEXTS);
    expect(
      tape.queue().map((chip) => chip.next),
      'the earliest time is the one that goes next',
    ).toEqual([true, false]);
    expect(tape.hasQueue()).toBe(true);
    expect(tape.showQueue()).toBe(true);
    expect(tape.pickedChip()).toBeNull();

    tape.onAssign(KUZNETSOV_RUNNER_ID);

    expect(tape.flyingText(), 'the chip flies away with the time it carried').toBe(TAPE_QUEUE_TIME_TEXTS[0]);

    const ordered = applyLastChange(TIMER_SESSION).splits.find((split) => split.id === FIRST_UNNAMED_SPLIT_ID);

    expect(ordered?.runnerId).toBe(KUZNETSOV_RUNNER_ID);

    tape.onFlyEnd();

    expect(tape.flyingText()).toBeNull();

    tape.onPick(SECOND_UNNAMED_SPLIT_ID);

    expect(tape.pickedChip()?.id).toBe(SECOND_UNNAMED_SPLIT_ID);
    expect(
      tape.queue().map((chip) => chip.next),
      'a picked chip becomes the next one',
    ).toEqual([false, true]);

    tape.onAssign(KUZNETSOV_RUNNER_ID);

    const byHand = applyLastChange(TIMER_SESSION).splits.find((split) => split.id === SECOND_UNNAMED_SPLIT_ID);

    expect(byHand?.runnerId).toBe(KUZNETSOV_RUNNER_ID);
    expect(tape.pickedChip(), 'the handout puts the queue back in order').toBeNull();

    tape.onPick(FIRST_UNNAMED_SPLIT_ID);
    tape.onPick(FIRST_UNNAMED_SPLIT_ID);

    expect(tape.pickedChip(), 'picking the same chip twice unpicks it').toBeNull();

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);
    sessions.updateActive.mockClear();
    tape.onAssign(KUZNETSOV_RUNNER_ID);

    expect(sessions.updateActive, 'an empty queue has nothing to hand out').not.toHaveBeenCalled();
    expect(tape.showQueue(), 'a chip still in flight keeps the row alive').toBe(true);

    tape.onFlyEnd();

    expect(tape.showQueue()).toBe(false);
  });

  it('opens the handout panel by itself and on request, and lists the rows the core would refuse', () => {
    const opened: boolean[] = [];

    tape.panelOpen.subscribe((open) => opened.push(open));
    sessions.active.set(TIMER_SESSION);
    tape.onToggle();

    expect(tape.open()).toBe(true);
    expect(opened, 'the page loses a grid row while the queue is open').toEqual([true]);
    expect(tape.runners().map((runner) => runner.metaText)).toEqual(TAPE_RUNNER_META_TEXTS);
    expect(tape.runners().map((runner) => runner.taken)).toEqual(TAPE_RUNNER_TAKEN_FLAGS);
    expect(tape.queueCount()).toBe(TAPE_QUEUE_TIME_TEXTS.length);

    tape.onToggle();

    expect(tape.open()).toBe(false);
    expect(opened).toEqual([true, false]);

    fixture.componentRef.setInput('openRequest', TAPE_ONE_OPEN_REQUEST);

    expect(tape.open(), '«Разобрать» on the publish card opens the very same panel').toBe(true);
  });

  it('asks by name before it throws a picked time away, and takes no for an answer', async () => {
    sessions.active.set(TIMER_SESSION);
    tape.onToggle();
    tape.onPick(FIRST_UNNAMED_SPLIT_ID);
    await fixture.whenStable();

    const element = fixture.nativeElement;
    const dialog = (): HTMLDialogElement | null => element.querySelector('dialog.timer-confirm');
    const ask = async (): Promise<void> => {
      element.querySelector('.timer-tape__discard').click();
      await fixture.whenStable();
    };

    expect(element.querySelectorAll('.timer-tape__chip')).toHaveLength(TAPE_QUEUE_TIME_TEXTS.length);
    expect(element.querySelector('.timer-tape__count').textContent.trim()).toBe(String(TAPE_QUEUE_TIME_TEXTS.length));
    expect(element.querySelectorAll('.timer-tape__runner')).toHaveLength(TAPE_RUNNER_META_TEXTS.length);
    expect(element.querySelector('.timer-tape__runner').disabled, 'the first row is already full').toBe(true);
    expect(dialog(), 'nothing is asked until the organiser asks for it').toBeNull();

    await ask();

    expect(dialog()?.open).toBe(true);
    expect(dialog()?.querySelector('.timer-confirm__note')?.textContent, 'the question names the very time it is about').toContain(
      TAPE_QUEUE_TIME_TEXTS[0],
    );

    dialog()?.querySelector<HTMLElement>('.timer-confirm__cancel')?.click();
    await fixture.whenStable();

    expect(sessions.updateActive, '«Отмена» leaves the queue exactly as it was').not.toHaveBeenCalled();
    expect(haptics.play, 'and nothing is felt for a question that was answered «нет»').not.toHaveBeenCalled();
    expect(dialog(), 'the question is gone with it').toBeNull();

    await ask();
    dialog()?.querySelector<HTMLElement>('.timer-confirm__action')?.click();
    await fixture.whenStable();

    const discarded = applyLastChange(TIMER_SESSION);

    expect(discarded.splits).toHaveLength(TIMER_SESSION.splits.length - 1);
    expect(discarded.splits.some((split) => split.id === FIRST_UNNAMED_SPLIT_ID)).toBe(false);
    expect(tape.pickedChip(), 'the queue is back in order behind the discard').toBeNull();
    expect(dialog(), 'and the question closes itself behind the deed').toBeNull();

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);
    await fixture.whenStable();

    expect(element.querySelector('.timer-tape__done'), 'an emptied queue says so instead of showing names').not.toBeNull();
    expect(element.querySelector('.timer-tape__more').disabled, 'nothing recorded, nothing to repeat').toBe(true);

    sessions.active.set(TIMER_SESSION_IDLE);
    await fixture.whenStable();

    expect(element.querySelector('.timer-tape__cut').disabled, 'and «ОТСЕЧКА» is dead before the start').toBe(true);
    expect(element.querySelector('.timer-tape__keys-hint').textContent.trim()).toBe(TAPE_IDLE_HINT);
  });
});
