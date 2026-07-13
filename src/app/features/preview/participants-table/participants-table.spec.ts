import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gender } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import { ParticipantsTable } from './participants-table';
import {
  COLUMN_SCOPE,
  EXPECTED_ARIA_PRESSED,
  EXPECTED_ROW_VIEWS,
  EXPECTED_UNVERIFIED_HINT_COUNT,
  FULL_DISTANCE_ID,
  TABLE_PARTICIPANTS,
} from './participants-table.mock';

describe('ParticipantsTable', () => {
  const participants = signal<Participant[]>([]);
  const setGender = vi.fn();

  let fixture: ComponentFixture<ParticipantsTable>;
  let table: ParticipantsTable;

  beforeEach(() => {
    vi.clearAllMocks();
    participants.set(TABLE_PARTICIPANTS);
    TestBed.configureTestingModule({
      providers: [{ provide: ProtocolStateService, useValue: { participants, setGender } }],
    });
    fixture = TestBed.createComponent(ParticipantsTable);
    table = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('precomputes row view-models for the 5 km, 2.3 km and DNF branches', () => {
    expect(table.rows()).toEqual(EXPECTED_ROW_VIEWS);
  });

  it('reflects gender in aria-pressed, forwards gender edits and renders the note as read-only text', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const toggles = [...element.querySelectorAll('.participants-table__gender-toggle')];

    expect(toggles.map((toggle) => toggle.getAttribute('aria-pressed'))).toEqual(EXPECTED_ARIA_PRESSED);

    const headers = [...element.querySelectorAll('.participants-table__header')];

    expect(headers.every((header) => header.getAttribute('scope') === COLUMN_SCOPE)).toBe(true);
    expect(element.querySelectorAll('.visually-hidden')).toHaveLength(EXPECTED_UNVERIFIED_HINT_COUNT);

    const noteCells = [...element.querySelectorAll('.participants-table__cell_note')];

    expect(
      noteCells.map((cell) => cell.textContent.trim()),
      'the auto note is printed as plain text',
    ).toEqual(EXPECTED_ROW_VIEWS.map((row) => row.noteText));
    expect(element.querySelector('.participants-table__cell_note input'), 'no note editing').toBeNull();

    table.setMale(FULL_DISTANCE_ID);
    table.setFemale(FULL_DISTANCE_ID);

    expect(setGender).toHaveBeenNthCalledWith(1, FULL_DISTANCE_ID, Gender.male);
    expect(setGender).toHaveBeenNthCalledWith(2, FULL_DISTANCE_ID, Gender.female);
  });
});
