import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { VALID_HISTORY } from '../../core/github/history-file.mock';
import { AthletesHistory } from '../../core/models/athletes-history.type';
import { Participant } from '../../core/models/participant.interface';
import { RaceEvent } from '../../core/models/race-event.interface';
import { buildProtocolRows } from '../../core/protocol/protocol-builder';
import { HistoryService } from '../../github/history.service';
import { ResultsService } from '../../github/results.service';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { SourceFile } from '../../state/source-file.interface';
import { settle } from '../spec-utils/settle';
import { PreviewPage } from './preview-page';
import { RESULT_ROUTE_COMMANDS } from './preview-page.constant';
import { HistoryNotesStatus } from './preview-page.enum';
import {
  ACTIVE_READY_READINESS,
  ACTIVE_UNREADY_READINESS,
  BATCH_DRAFT_COUNT,
  BATCH_UNREADY_COUNT,
  EXPECTED_BATCH_WARNING_COUNT,
  EXPECTED_OTHER_UNREADY_WHEN_ACTIVE_READY,
  EXPECTED_OTHER_UNREADY_WHEN_ACTIVE_UNREADY,
  EXPECTED_PUBLISHED_DATES,
  HISTORY_LOAD_ERROR_MESSAGE,
  UNVERIFIED_COUNT,
} from './preview-page.mock';

describe('PreviewPage', () => {
  const participants = signal<Participant[]>([]);
  const suggestedDateIso = signal<string | null>(null);
  const unknownGenderCount = signal(0);
  const canGenerate = signal(false);
  const event = signal<RaceEvent | null>(null);
  const activeNumberingDates = signal<string[] | null>(null);
  const draftCount = signal(1);
  const unreadyDraftCount = signal(0);
  const hasDuplicateDates = signal(false);
  const draftsReady = signal<boolean[]>([]);
  const activeIndex = signal(0);
  const sourceFile = signal<SourceFile | null>(null);
  const setEvent = vi.fn();
  const setGender = vi.fn();
  const selectDraft = vi.fn();
  const applyAutoNotes = vi.fn();
  const setPublishedEventDates = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  const loadHistory = vi.fn(() => Promise.resolve<AthletesHistory>(VALID_HISTORY));
  const loadFinishCountsBefore = vi.fn(() => Promise.resolve<Record<string, number>>({}));

  let fixture: ComponentFixture<PreviewPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    unknownGenderCount.set(0);
    canGenerate.set(false);
    event.set(null);
    draftCount.set(1);
    unreadyDraftCount.set(0);
    hasDuplicateDates.set(false);
    draftsReady.set([]);
    activeIndex.set(0);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProtocolStateService,
          useValue: {
            participants,
            suggestedDateIso,
            unknownGenderCount,
            canGenerate,
            event,
            activeNumberingDates,
            draftCount,
            unreadyDraftCount,
            hasDuplicateDates,
            draftsReady,
            activeIndex,
            sourceFile,
            protocolRows: computed(() => buildProtocolRows(participants())),
            draftRowsBefore: () => [],
            setEvent,
            setGender,
            selectDraft,
            applyAutoNotes,
            setPublishedEventDates,
          },
        },
        { provide: ResultsService, useValue: { loadFinishCountsBefore } },
        { provide: Router, useValue: { navigate } },
        { provide: HistoryService, useValue: { loadHistory } },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('hides the warnings and the pager, disables generation and loads the history so the auto number can unblock the form', () => {
    fixture = TestBed.createComponent(PreviewPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.hasUnverified()).toBe(false);
    expect(fixture.nativeElement.querySelector('.preview__warning')).toBeNull();
    expect(fixture.nativeElement.querySelector('.pager'), 'a single draft needs no pager').toBeNull();
    expect(fixture.nativeElement.querySelector('.preview__generate').disabled).toBe(true);
    expect(loadHistory, 'archive dates feed the positional race number').toHaveBeenCalled();
  });

  it('shows the batch warnings as live statuses, the plural generate button, and navigates to /result on click', () => {
    unknownGenderCount.set(UNVERIFIED_COUNT);
    canGenerate.set(true);
    draftCount.set(BATCH_DRAFT_COUNT);
    unreadyDraftCount.set(BATCH_UNREADY_COUNT);
    draftsReady.set(ACTIVE_UNREADY_READINESS);
    hasDuplicateDates.set(true);
    fixture = TestBed.createComponent(PreviewPage);
    fixture.detectChanges();

    const warnings = [...fixture.nativeElement.querySelectorAll('.preview__warning')];

    expect(warnings).toHaveLength(EXPECTED_BATCH_WARNING_COUNT);
    expect(warnings[0].textContent).toContain(String(UNVERIFIED_COUNT));
    expect(warnings[0].getAttribute('role')).toBe('status');
    expect(warnings[0].getAttribute('aria-live')).toBe('polite');
    expect(warnings[1].textContent, 'the active unready draft is not double-counted').toContain(
      String(EXPECTED_OTHER_UNREADY_WHEN_ACTIVE_UNREADY),
    );
    expect(warnings[2].getAttribute('role'), 'duplicate dates block the batch loudly').toBe('alert');
    expect(fixture.nativeElement.querySelector('main').id).toBe('main');

    draftsReady.set(ACTIVE_READY_READINESS);

    expect(fixture.componentInstance.otherUnreadyCount(), 'a ready active draft leaves every unready sibling counted').toBe(
      EXPECTED_OTHER_UNREADY_WHEN_ACTIVE_READY,
    );

    const button = fixture.nativeElement.querySelector('.preview__generate');

    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain(`(${BATCH_DRAFT_COUNT})`);

    button.click();

    expect(navigate).toHaveBeenCalledWith(RESULT_ROUTE_COMMANDS);
  });

  it('loads history on init, applies the auto notes once it lands and surfaces a load failure', async () => {
    let resolveHistory!: (history: AthletesHistory) => void;

    loadHistory.mockReturnValueOnce(new Promise((resolve) => (resolveHistory = resolve)));
    fixture = TestBed.createComponent(PreviewPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.loading);
    expect(fixture.nativeElement.querySelector('.preview__history-status').getAttribute('aria-live')).toBe('polite');
    expect(fixture.nativeElement.querySelector('.preview__history-status span')).not.toBeNull();
    expect(applyAutoNotes, 'nothing to apply before the history lands').not.toHaveBeenCalled();

    resolveHistory(VALID_HISTORY);
    await settle();
    fixture.detectChanges();

    expect(setPublishedEventDates, 'the loaded archive dates feed the auto race number').toHaveBeenCalledWith(EXPECTED_PUBLISHED_DATES);
    expect(applyAutoNotes, 'the store runs the notes once per draft, so only the history is passed').toHaveBeenCalledWith(VALID_HISTORY);
    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.idle);

    fixture.destroy();
    loadHistory.mockRejectedValueOnce(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    fixture = TestBed.createComponent(PreviewPage);
    fixture.detectChanges();
    await settle();

    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.preview__history-error').getAttribute('role')).toBe('alert');
  });
});
