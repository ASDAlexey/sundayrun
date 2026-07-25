import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerRosterServiceMock, timerRosterServiceMock } from '../../../state/timer-roster.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerLapBoard } from './lap-board';
import {
  LAP_BEST_LAP_MS,
  LAP_BOARD_SESSION,
  LAP_BOARD_SESSION_QUEUED,
  LAP_BOARD_SESSION_WITHOUT_SPLITS,
  LAP_COURSE_RECORD_LAP_MS,
  LAP_EXPECTED_GAP_TEXTS,
  LAP_EXPECTED_MARKS,
  LAP_EXPECTED_MOVED,
  LAP_EXPECTED_NOTE_STEPS,
  LAP_EXPECTED_PENDING_TEXT,
  LAP_EXPECTED_PENDING_TEXT_ALL,
  LAP_EXPECTED_PLACES,
  LAP_EXPECTED_ROW_STEPS,
  LAP_EXPECTED_TIME_TEXTS,
  LAP_QUEUED_NAME,
  LAP_QUEUED_PLACE,
  LAP_QUEUED_TIME_TEXT,
} from './lap-board.mock';

describe('TimerLapBoard', () => {
  let sessions: TimerSessionServiceMock;
  let roster: TimerRosterServiceMock;
  let fixture: ComponentFixture<TimerLapBoard>;
  let board: TimerLapBoard;

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    roster = timerRosterServiceMock();
    roster.bestLapMs.set(LAP_BEST_LAP_MS);
    roster.courseRecordLapMs.set(LAP_COURSE_RECORD_LAP_MS);
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerRosterService, useValue: roster },
      ],
    });
    fixture = TestBed.createComponent(TimerLapBoard);
    board = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('keeps the rows in roster order and moves them to their places by transform', () => {
    expect(board.rows(), 'no measurement is open, so there is no table').toEqual([]);
    expect(board.hasRows()).toBe(false);
    expect(board.pendingText(), 'nobody is expected when nothing is open').toBeNull();

    sessions.active.set(LAP_BOARD_SESSION_WITHOUT_SPLITS);

    expect(board.rows(), 'a roster without a single tap has no lap to show').toEqual([]);
    expect(board.pendingText()).toBe(LAP_EXPECTED_PENDING_TEXT_ALL);

    sessions.active.set(LAP_BOARD_SESSION);

    expect(
      board.rows().map((row) => row.place),
      'the rows stay in roster order, the places do not',
    ).toEqual(LAP_EXPECTED_PLACES);
    expect(
      board.rows().map((row) => row.rowSteps),
      'each row carries the travel to its own place, counted in rows and not in pixels',
    ).toEqual(LAP_EXPECTED_ROW_STEPS);
    expect(
      board.rows().map((row) => row.noteSteps),
      'and how many marked rows that travel crosses — the stylesheet owns what a mark is worth',
    ).toEqual(LAP_EXPECTED_NOTE_STEPS);
    expect(board.rows().map((row) => row.moved)).toEqual(LAP_EXPECTED_MOVED);
    expect(board.rows().map((row) => row.timeText)).toEqual(LAP_EXPECTED_TIME_TEXTS);
    expect(board.rows().map((row) => row.gapText)).toEqual(LAP_EXPECTED_GAP_TEXTS);
    expect(board.hasRows()).toBe(true);
    expect(board.pendingText()).toBe(LAP_EXPECTED_PENDING_TEXT);
  });

  it('marks a course-record lap and a personal best, and stays silent without history', () => {
    sessions.active.set(LAP_BOARD_SESSION);

    expect(board.rows().map((row) => row.mark)).toEqual(LAP_EXPECTED_MARKS);

    roster.bestLapMs.set(new Map());
    roster.courseRecordLapMs.set({ M: null, F: null });

    expect(
      board.rows().every((row) => row.mark === null),
      'an empty archive says nothing about anybody',
    ).toBe(true);
  });

  it('holds a place for a time nobody has claimed yet, and says so in the row', async () => {
    sessions.active.set(LAP_BOARD_SESSION_QUEUED);
    await fixture.whenStable();

    const queued = board.rows().find((row) => !row.named);

    expect(queued?.place, 'the queued time stands where it was recorded, not at the end').toBe(LAP_QUEUED_PLACE);
    expect(queued?.timeText).toBe(LAP_QUEUED_TIME_TEXT);
    expect(queued?.fullName, 'the place is held, the surname comes from the queue').toBe(LAP_QUEUED_NAME);
    expect(queued?.mark, 'the archive knows nothing about a line with no name on it').toBeNull();
    expect(board.rows().filter((row) => row.named).length, 'every runner through the lap is still there, one place lower').toBe(
      LAP_EXPECTED_PLACES.length,
    );
    expect(fixture.nativeElement.querySelectorAll('.timer-lap-board__name_blank')).toHaveLength(1);
  });

  it('renders the marks, the caveat and the empty state', () => {
    sessions.active.set(LAP_BOARD_SESSION);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const rows = element.querySelectorAll('.timer-lap-board__row');

    expect(rows).toHaveLength(LAP_EXPECTED_PLACES.length);
    expect(rows[1].style.getPropertyValue('--timer-lap-rows')).toBe(String(LAP_EXPECTED_ROW_STEPS[1]));
    expect(rows[1].style.getPropertyValue('--timer-lap-notes')).toBe(String(LAP_EXPECTED_NOTE_STEPS[1]));
    expect(rows[1].classList.contains('timer-lap-board__row_moved')).toBe(true);
    expect(rows[1].classList.contains('timer-lap-board__row_noted')).toBe(true);
    expect(element.querySelectorAll('.timer-lap-board__note')).toHaveLength(2);
    expect(element.querySelector('.timer-lap-board__pending').textContent.trim()).toBe(LAP_EXPECTED_PENDING_TEXT);
    expect(element.querySelector('.timer-lap-board__caveat'), 'the missing splits are admitted, not hidden').not.toBeNull();

    sessions.active.set(LAP_BOARD_SESSION_WITHOUT_SPLITS);
    fixture.detectChanges();

    expect(element.querySelectorAll('.timer-lap-board__row')).toHaveLength(0);
    expect(element.querySelector('.timer-lap-board__empty')).not.toBeNull();
  });
});
