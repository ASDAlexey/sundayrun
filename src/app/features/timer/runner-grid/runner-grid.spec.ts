import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TIMER_SESSION_IDLE } from '../../../core/timer/timer-session.mock';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { HapticsServiceMock, hapticsServiceMock } from '../../../state/haptics.service.mock';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerClockServiceMock, timerClockServiceMock } from '../../../state/timer-clock.service.mock';
import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerRosterServiceMock, timerRosterServiceMock } from '../../../state/timer-roster.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import {
  TILE_DOWN,
  TILE_DOWN_FOURTH,
  TILE_DOWN_LATE,
  TILE_DOWN_THIRD,
  TILE_UP_LONG_LATE,
  TILE_UP_SWIPE_LEFT,
  TILE_UP_SWIPE_RIGHT,
  tilePointerEvent,
} from '../runner-tile/runner-tile.mock';
import { TimerAnnouncementKind } from '../timer-announcement.enum';
import { TimerGrid } from './runner-grid';
import {
  CROWD_FINISHER_ID,
  GRID_CROWD_FINISH_TEXT,
  GRID_CROWD_SESSION,
  GRID_DRAGGED_SURNAMES,
  GRID_DROP_FROM,
  GRID_DROP_TO,
  GRID_EXPECTED_LABELS,
  GRID_EXPECTED_LAP_MS,
  GRID_LATE_TAP_MS,
  GRID_LATE_TAP_TIME_TEXT,
  GRID_PLAIN_AFTER_FINISH,
  GRID_PLAIN_ARRANGED_IDS,
  GRID_PLAIN_AFTER_LAP,
  GRID_PLAIN_INITIALS,
  GRID_PLAIN_LAP_MS,
  GRID_PLAIN_LAP_SPLIT,
  GRID_PLAIN_RETIRED,
  GRID_PLAIN_RUNNERS,
  GRID_PLAIN_RUNNING,
  GRID_PLAIN_DENSE_SESSION,
  GRID_PLAIN_SESSION,
  GRID_PLAIN_SURNAMES,
  GRID_QUIET_ELAPSED_MS,
  GRID_RESORTED_SURNAMES,
  GRID_SPELLED_GIVEN,
  GRID_TAP_TIME_TEXT,
  PLAIN_LEADER_ID,
  PLAIN_SECOND_ID,
  gridDropEvent,
} from './runner-grid.mock';

describe('TimerGrid', () => {
  let fixture: ComponentFixture<TimerGrid>;
  let sessions: TimerSessionServiceMock;
  let clock: TimerClockServiceMock;
  let roster: TimerRosterServiceMock;
  let haptics: HapticsServiceMock;
  const announced = vi.fn();
  const detailed = vi.fn();

  const tiles = (): HTMLElement[] => [...fixture.nativeElement.querySelectorAll('.timer-tile')];
  const textOf = (selector: string): (string | undefined)[] =>
    [...fixture.nativeElement.querySelectorAll(selector)].map((node) => node.textContent?.trim());

  const create = async (): Promise<void> => {
    fixture = TestBed.createComponent(TimerGrid);
    fixture.componentInstance.announce.subscribe(announced);
    fixture.componentInstance.details.subscribe(detailed);
    await fixture.whenStable();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessions = timerSessionServiceMock();
    clock = timerClockServiceMock();
    roster = timerRosterServiceMock();
    roster.expectedLapMs.set(GRID_EXPECTED_LAP_MS);
    haptics = hapticsServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerClockService, useValue: clock },
        { provide: TimerRosterService, useValue: roster },
        { provide: HapticsService, useValue: haptics },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('lays the tiles out by expected lap, shortens a first name only when nobody shares a surname', async () => {
    sessions.active.set(GRID_PLAIN_DENSE_SESSION);
    await create();

    const plainCount = GRID_PLAIN_SURNAMES.length;

    expect(fixture.nativeElement.querySelector('.timer-grid_dense'), 'twenty-five people tighten the grid by themselves').not.toBeNull();
    expect(textOf('.timer-tile__surname').slice(0, plainCount)).toEqual(GRID_PLAIN_SURNAMES);
    expect(textOf('.timer-tile__given').slice(0, plainCount), 'four columns leave room for an initial only').toEqual(GRID_PLAIN_INITIALS);

    sessions.active.set(TIMER_SESSION_IDLE);
    await fixture.whenStable();

    expect(tiles().map((tile) => tile.getAttribute('aria-label'))).toEqual(GRID_EXPECTED_LABELS);
    expect(textOf('.timer-tile__given'), 'two Поповых in the roster spell every name out').toEqual(GRID_SPELLED_GIVEN);

    sessions.active.set(null);
    await fixture.whenStable();

    expect(tiles(), 'no measurement, no keyboard').toEqual([]);
  });

  it('records on every tap of the same tile and never deletes one', async () => {
    sessions.active.set(GRID_PLAIN_RUNNING);
    await create();

    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));

    expect(announced).toHaveBeenCalledWith({
      kind: TimerAnnouncementKind.lap,
      name: GRID_PLAIN_RUNNERS[0].fullName,
      timeText: GRID_TAP_TIME_TEXT,
    });
    expect(sessions.updateActive.mock.calls[0][0](GRID_PLAIN_RUNNING).splits.length).toBe(1);
    expect(haptics.play, 'the shortest possible «принял»').toHaveBeenCalledExactlyOnceWith(TimerFeedback.lap);

    clock.nowMs.mockReturnValue(GRID_LATE_TAP_MS);
    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));

    const recorded: TimerSession = sessions.updateActive.mock.calls[1][0](GRID_PLAIN_RUNNING);

    expect(announced, 'a second press on the same tile is the next time, not an undo').toHaveBeenLastCalledWith({
      kind: TimerAnnouncementKind.lap,
      name: GRID_PLAIN_RUNNERS[0].fullName,
      timeText: GRID_LATE_TAP_TIME_TEXT,
    });
    expect(recorded.splits.length).toBe(1);

    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_THIRD));

    expect(announced, 'and so is a third, however fast they follow each other').toHaveBeenLastCalledWith({
      kind: TimerAnnouncementKind.lap,
      name: GRID_PLAIN_RUNNERS[0].fullName,
      timeText: GRID_LATE_TAP_TIME_TEXT,
    });
    expect(sessions.updateActive).toHaveBeenCalledTimes(3);
    expect(sessions.updateActive.mock.calls[2][0](recorded).splits.length, 'a tap only ever adds').toBe(2);

    tiles()[1].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_FOURTH));
    tiles()[1].dispatchEvent(tilePointerEvent('pointerup', TILE_UP_LONG_LATE));

    expect(detailed, 'a long press hands the whole tile up to the page').toHaveBeenCalledWith(
      expect.objectContaining({ runner: GRID_PLAIN_RUNNERS[1] }),
    );
  });

  it('calls the second tap on a runner his finish and refuses a tile that has nothing left to give', async () => {
    sessions.active.set(GRID_PLAIN_AFTER_LAP);
    await create();

    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));

    expect(announced).toHaveBeenCalledWith({
      kind: TimerAnnouncementKind.finish,
      name: GRID_PLAIN_RUNNERS[0].fullName,
      timeText: GRID_TAP_TIME_TEXT,
    });
    expect(haptics.play, 'a double tick: «человек закончил»').toHaveBeenCalledExactlyOnceWith(TimerFeedback.finish);

    clock.nowMs.mockReturnValue(GRID_LATE_TAP_MS);
    sessions.active.set(GRID_PLAIN_AFTER_FINISH);
    await fixture.whenStable();
    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));

    expect(sessions.updateActive, 'a finished runner is done being tapped').toHaveBeenCalledTimes(1);
    expect(haptics.play, 'twice sharply, so the thumb knows without looking').toHaveBeenLastCalledWith(TimerFeedback.error);

    sessions.active.set(GRID_PLAIN_RETIRED);
    await fixture.whenStable();
    tiles()[1].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_THIRD));

    expect(sessions.updateActive, 'and neither is somebody who withdrew').toHaveBeenCalledTimes(1);

    sessions.active.set(GRID_PLAIN_SESSION);
    await fixture.whenStable();
    tiles()[2].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_FOURTH));

    expect(sessions.updateActive, 'before the start a tap records nothing at all').toHaveBeenCalledTimes(1);
  });

  it('rolls a swipe own cut back, retires on a swipe left and stays silent when there was no time', async () => {
    sessions.active.set(GRID_PLAIN_AFTER_LAP);
    await create();

    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    tiles()[0].dispatchEvent(tilePointerEvent('pointerup', TILE_UP_SWIPE_RIGHT));

    expect(announced).toHaveBeenLastCalledWith({
      kind: TimerAnnouncementKind.undo,
      name: GRID_PLAIN_RUNNERS[0].fullName,
      timeText: GRID_TAP_TIME_TEXT,
    });
    expect(sessions.updateActive.mock.calls[1][0](GRID_PLAIN_AFTER_LAP).splits).toEqual([]);

    tiles()[1].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));
    tiles()[1].dispatchEvent(tilePointerEvent('pointerup', TILE_UP_SWIPE_LEFT));

    const retirement: TimerSession = sessions.updateActive.mock.calls[4][0](GRID_PLAIN_AFTER_LAP);

    expect(retirement.runners.find((runner) => runner.id === PLAIN_SECOND_ID)?.outcome).toBe(TimerRunnerOutcome.dnf);

    sessions.active.set(GRID_PLAIN_SESSION);
    await fixture.whenStable();
    announced.mockClear();
    tiles()[2].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_THIRD));
    tiles()[2].dispatchEvent(tilePointerEvent('pointerup', TILE_UP_SWIPE_RIGHT));

    expect(announced, 'there was nothing to take back, so nothing is read out').not.toHaveBeenCalled();
    expect(haptics.play, 'and nothing is felt either').toHaveBeenLastCalledWith(TimerFeedback.error);
  });

  it('takes the phantom split of a scroll back by its own id, and none at all after a refused tap', async () => {
    sessions.active.set(GRID_PLAIN_AFTER_LAP);
    await create();

    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));

    const written: TimerSession = sessions.updateActive.mock.calls[0][0](GRID_PLAIN_AFTER_LAP);

    expect(written.splits.length, 'the finish is on paper before the browser has decided what the gesture was').toBe(2);

    announced.mockClear();
    haptics.play.mockClear();
    tiles()[0].dispatchEvent(tilePointerEvent('pointercancel', TILE_DOWN));

    expect(sessions.updateActive.mock.calls[1][0](written).splits, 'exactly that split goes, and the lap under it stays').toEqual([
      GRID_PLAIN_LAP_SPLIT,
    ]);
    expect(announced, 'the organiser never meant this tap, so nothing is read out').not.toHaveBeenCalled();
    expect(haptics.play, 'and nothing is felt: a buzz for a scroll would read as a refused tap').not.toHaveBeenCalled();

    sessions.active.set(GRID_PLAIN_AFTER_FINISH);
    await fixture.whenStable();
    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));
    tiles()[0].dispatchEvent(tilePointerEvent('pointercancel', TILE_DOWN_LATE));

    expect(haptics.play, 'a spent tile refuses the tap').toHaveBeenCalledExactlyOnceWith(TimerFeedback.error);
    expect(sessions.updateActive, 'and a refused tap leaves nothing for the cancel to cash in').toHaveBeenCalledTimes(2);
  });

  it('moves the finishers to the shelf only in the quiet, and takes one back on a tap', async () => {
    sessions.active.set(GRID_CROWD_SESSION);
    await create();

    expect(tiles().length).toBe(GRID_CROWD_SESSION.runners.length - 1);
    expect(textOf('.timer-grid__shelf-time')).toEqual([GRID_CROWD_FINISH_TEXT]);

    fixture.nativeElement.querySelector('.timer-grid__shelf-item').click();

    expect(announced).toHaveBeenCalledWith({
      kind: TimerAnnouncementKind.undo,
      name: GRID_CROWD_SESSION.runners[0].fullName,
      timeText: GRID_CROWD_FINISH_TEXT,
    });
    expect(sessions.updateActive.mock.calls[0][0](GRID_CROWD_SESSION).splits.length).toBe(1);

    tiles()[0].dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.timer-grid__shelf'), 'nothing moves under a busy finger').toBeNull();

    clock.elapsedMs.set(GRID_QUIET_ELAPSED_MS);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.timer-grid__shelf')).not.toBeNull();
    expect(tiles().some((tile) => tile.getAttribute('aria-label') === CROWD_FINISHER_ID)).toBe(false);
  });

  it('lets the judge arrange the tiles by hand before the start, and keeps that order with the measurement', async () => {
    sessions.active.set(GRID_PLAIN_SESSION);
    await create();

    // The drop list is the tile grid inside the density wrapper, not the wrapper itself.
    const container = fixture.debugElement.children[0].children[0];
    const list = container.injector.get(CdkDropList);
    const item = container.children[GRID_DROP_FROM].injector.get(CdkDrag);

    list.dropped.emit(gridDropEvent(list, item, GRID_DROP_FROM, GRID_DROP_TO));

    const arranged: TimerSession = sessions.updateActive.mock.calls[0][0](GRID_PLAIN_SESSION);

    expect(arranged.tileOrder, 'the drag is written down, not kept in the screen').toEqual(GRID_PLAIN_ARRANGED_IDS);

    sessions.active.set(arranged);
    roster.expectedLapMs.set(GRID_PLAIN_LAP_MS);
    await fixture.whenStable();

    expect(textOf('.timer-tile__surname'), 'a hand-made order outranks the archive from then on').toEqual(GRID_DRAGGED_SURNAMES);
  });

  /**
   * The bug a volunteer reported after the race: the tiles were in other places when she came back to
   * the app. The «Круг» tab, the runner's card and a backgrounded tab all destroy this component.
   */
  it('lays the tiles out where the running measurement says, however often the grid is rebuilt', async () => {
    const running: TimerSession = { ...GRID_PLAIN_RUNNING, tileOrder: [...GRID_PLAIN_ARRANGED_IDS] };

    sessions.active.set(running);
    roster.expectedLapMs.set(GRID_PLAIN_LAP_MS);
    await create();

    expect(textOf('.timer-tile__surname')).toEqual(GRID_DRAGGED_SURNAMES);

    fixture.destroy();
    await create();

    expect(textOf('.timer-tile__surname'), 'a grid built from scratch mid-race puts nothing anywhere new').toEqual(GRID_DRAGGED_SURNAMES);

    sessions.active.set({ ...running, tileOrder: [] });
    await fixture.whenStable();

    expect(textOf('.timer-tile__surname'), 'and a race started before the order was written down still sorts itself').toEqual(
      GRID_RESORTED_SURNAMES,
    );
  });

  it('carries a «×» on every tile before the start and none once the clock runs', async () => {
    sessions.active.set(GRID_PLAIN_SESSION);
    await create();

    const removes: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('.timer-tile__remove')];

    expect(removes.length, 'a surname misheard at the sign-up table is undone where it is seen').toBe(GRID_PLAIN_SESSION.runners.length);

    removes[0].click();

    const shortened: TimerSession = sessions.updateActive.mock.calls[0][0](GRID_PLAIN_SESSION);

    expect(
      shortened.runners.map((runner) => runner.id),
      'the man goes and nothing is asked — nothing has been timed yet',
    ).not.toContain(PLAIN_LEADER_ID);

    sessions.active.set(GRID_PLAIN_RUNNING);
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.timer-tile__remove'),
      'mid-race the same corner would be a split lost under the thumb',
    ).toBeNull();
  });
});
