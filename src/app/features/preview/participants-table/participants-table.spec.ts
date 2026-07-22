import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gender } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { RaceEvent } from '../../../core/models/race-event.interface';
import { buildProtocolRows } from '../../../core/protocol/protocol-builder';
import { ResultsService } from '../../../github/results.service';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import { ParticipantsTable } from './participants-table';
import {
  COLUMN_SCOPE,
  EXPECTED_ARIA_PRESSED,
  EXPECTED_LOADED_FINISH_CLASS,
  EXPECTED_LOADED_FINISH_TEXT,
  EXPECTED_MEDAL_COUNT,
  EXPECTED_ROW_VIEWS,
  EXPECTED_UNVERIFIED_HINT_COUNT,
  FULL_DISTANCE_ID,
  OTHER_DATE_ISO,
  OWN_FINISH_ONLY_TEXT,
  PRIOR_FINISH_COUNTS,
  STALE_FINISH_COUNTS,
  TABLE_DATE_ISO,
  TABLE_PARTICIPANTS,
} from './participants-table.mock';

describe('ParticipantsTable', () => {
  const participants = signal<Participant[]>([]);
  const suggestedDateIso = signal<string | null>(TABLE_DATE_ISO);
  const event = signal<RaceEvent | null>(null);
  const setGender = vi.fn();
  const loadFinishCountsBefore = vi.fn();

  let fixture: ComponentFixture<ParticipantsTable>;
  let table: ParticipantsTable;

  const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  beforeEach(() => {
    vi.clearAllMocks();
    participants.set(TABLE_PARTICIPANTS);
    suggestedDateIso.set(TABLE_DATE_ISO);
    loadFinishCountsBefore.mockResolvedValue(PRIOR_FINISH_COUNTS);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProtocolStateService,
          useValue: {
            participants,
            event,
            suggestedDateIso,
            protocolRows: computed(() => buildProtocolRows(participants())),
            draftRowsBefore: () => [],
            setGender,
          },
        },
        { provide: ResultsService, useValue: { loadFinishCountsBefore } },
      ],
    });
    fixture = TestBed.createComponent(ParticipantsTable);
    table = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('builds protocol-shaped rows, then merges the stored finish counts and drops stale or dateless reads', async () => {
    expect(table.rows()).toEqual(EXPECTED_ROW_VIEWS);

    fixture.detectChanges();
    await flush();

    expect(table.rows()[0].finishCountText, 'stored counts landed').toBe(EXPECTED_LOADED_FINISH_TEXT);
    expect(table.rows()[0].finishClubClass).toBe(EXPECTED_LOADED_FINISH_CLASS);

    // A date change re-anchors the counts; an in-flight read for the old date must be dropped.
    let resolveStale: (counts: Record<string, number>) => void = vi.fn();

    loadFinishCountsBefore.mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve)));
    suggestedDateIso.set(OTHER_DATE_ISO);
    fixture.detectChanges();
    await flush();

    suggestedDateIso.set(TABLE_DATE_ISO);
    fixture.detectChanges();
    await flush();
    resolveStale(STALE_FINISH_COUNTS);
    await flush();

    expect(table.rows()[0].finishCountText, 'the stale payload never lands').toBe(EXPECTED_LOADED_FINISH_TEXT);

    // A failed archive read leaves only the draft's own finishes — a blank prior beats a wrong one.
    loadFinishCountsBefore.mockRejectedValueOnce(new Error('db down'));
    suggestedDateIso.set(OTHER_DATE_ISO);
    fixture.detectChanges();
    await flush();

    expect(table.rows()[0].finishCountText).toBe(OWN_FINISH_ONLY_TEXT);

    // Without a date the column goes blank entirely.
    suggestedDateIso.set(null);
    fixture.detectChanges();
    await flush();

    expect(table.rows()[0].finishCountText).toBe('');
  });

  it('renders the protocol design and forwards gender edits', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const toggles = [...element.querySelectorAll('.participants-table__gender-toggle')];

    expect(toggles.map((toggle) => toggle.getAttribute('aria-pressed'))).toEqual(EXPECTED_ARIA_PRESSED);

    const headers = [...element.querySelectorAll('.participants-table__header')];

    expect(headers.every((header) => header.getAttribute('scope') === COLUMN_SCOPE)).toBe(true);
    expect(element.querySelectorAll('.visually-hidden')).toHaveLength(EXPECTED_UNVERIFIED_HINT_COUNT);
    expect(element.querySelectorAll('.participants-table__medal'), 'the male podium wears its medals').toHaveLength(EXPECTED_MEDAL_COUNT);
    expect(element.querySelector('.participants-table__note-text')?.textContent?.trim(), 'the note prints as read-only text').toBe(
      EXPECTED_ROW_VIEWS[2].noteBadges[0].text,
    );
    expect(element.querySelector('.participants-table__notes input'), 'no note editing').toBeNull();

    table.setMale(FULL_DISTANCE_ID);
    table.setFemale(FULL_DISTANCE_ID);

    expect(setGender).toHaveBeenNthCalledWith(1, FULL_DISTANCE_ID, Gender.male);
    expect(setGender).toHaveBeenNthCalledWith(2, FULL_DISTANCE_ID, Gender.female);
  });
});
