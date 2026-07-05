import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { VALID_HISTORY } from '../../core/github/history-file.mock';
import { AthletesHistory } from '../../core/models/athletes-history.type';
import { Participant } from '../../core/models/participant.interface';
import { RaceEvent } from '../../core/models/race-event.interface';
import { HistoryService } from '../../github/history.service';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { RACE_EVENT } from '../../state/protocol-state.service.mock';
import { PreviewPage } from './preview-page';
import { RESULT_ROUTE_COMMANDS } from './preview-page.constant';
import { HistoryNotesStatus } from './preview-page.enum';
import { HISTORY_LOAD_ERROR_MESSAGE, UNVERIFIED_COUNT } from './preview-page.mock';

describe('PreviewPage', () => {
  const participants = signal<Participant[]>([]);
  const suggestedDateIso = signal<string | null>(null);
  const unknownGenderCount = signal(0);
  const canGenerate = signal(false);
  const event = signal<RaceEvent | null>(null);
  const setEvent = vi.fn();
  const setGender = vi.fn();
  const setNote = vi.fn();
  const applyAutoNotes = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  const loadHistory = vi.fn(() => Promise.resolve<AthletesHistory>(VALID_HISTORY));

  let fixture: ComponentFixture<PreviewPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    unknownGenderCount.set(0);
    canGenerate.set(false);
    event.set(null);
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
            setEvent,
            setGender,
            setNote,
            applyAutoNotes,
          },
        },
        { provide: Router, useValue: { navigate } },
        { provide: HistoryService, useValue: { loadHistory } },
      ],
    });
    fixture = TestBed.createComponent(PreviewPage);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('hides the warning and disables generation and history notes until the protocol is ready', async () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.hasUnverified()).toBe(false);
    expect(fixture.nativeElement.querySelector('.preview__warning')).toBeNull();
    expect(fixture.nativeElement.querySelector('.preview__generate').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.preview__history-button').disabled).toBe(true);

    await fixture.componentInstance.applyHistoryNotes();

    expect(loadHistory, 'no event date yet — the click is a no-op').not.toHaveBeenCalled();
  });

  it('shows the unverified counter as a live status, enables the button and navigates to /result on click', () => {
    unknownGenderCount.set(UNVERIFIED_COUNT);
    canGenerate.set(true);
    fixture.detectChanges();

    const warning = fixture.nativeElement.querySelector('.preview__warning');

    expect(warning.textContent).toContain(String(UNVERIFIED_COUNT));
    expect(warning.getAttribute('role')).toBe('status');
    expect(warning.getAttribute('aria-live')).toBe('polite');
    expect(fixture.nativeElement.querySelector('main').id).toBe('main');

    const button = fixture.nativeElement.querySelector('.preview__generate');

    expect(button.disabled).toBe(false);

    button.click();

    expect(navigate).toHaveBeenCalledWith(RESULT_ROUTE_COMMANDS);
  });

  it('loads the history once the event date is known, applies auto notes and surfaces a load failure', async () => {
    event.set(RACE_EVENT);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.preview__history-button');

    expect(button.disabled).toBe(false);

    let resolveHistory!: (history: AthletesHistory) => void;

    loadHistory.mockReturnValueOnce(new Promise((resolve) => (resolveHistory = resolve)));

    const pending = fixture.componentInstance.applyHistoryNotes();

    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.loading);
    expect(fixture.componentInstance.canApplyHistoryNotes(), 'no double-fire while loading').toBe(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.preview__history-status').getAttribute('aria-live')).toBe('polite');
    expect(fixture.nativeElement.querySelector('.preview__history-status span')).not.toBeNull();

    resolveHistory(VALID_HISTORY);
    await pending;

    expect(applyAutoNotes).toHaveBeenCalledWith(VALID_HISTORY, RACE_EVENT.dateIso);
    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.idle);

    loadHistory.mockRejectedValueOnce(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    await fixture.componentInstance.applyHistoryNotes();
    fixture.detectChanges();

    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.error);
    expect(fixture.nativeElement.querySelector('.preview__history-error').getAttribute('role')).toBe('alert');
    expect(applyAutoNotes).toHaveBeenCalledTimes(1);
  });
});
