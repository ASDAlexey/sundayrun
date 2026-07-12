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
import { settle } from '../spec-utils/settle';
import { PreviewPage } from './preview-page';
import { RESULT_ROUTE_COMMANDS } from './preview-page.constant';
import { HistoryNotesStatus } from './preview-page.enum';
import { CHANGED_EVENT_DATE_ISO, EXPECTED_PUBLISHED_DATES, HISTORY_LOAD_ERROR_MESSAGE, UNVERIFIED_COUNT } from './preview-page.mock';

describe('PreviewPage', () => {
  const participants = signal<Participant[]>([]);
  const suggestedDateIso = signal<string | null>(null);
  const unknownGenderCount = signal(0);
  const canGenerate = signal(false);
  const event = signal<RaceEvent | null>(null);
  const publishedEventDates = signal<string[] | null>(null);
  const setEvent = vi.fn();
  const setGender = vi.fn();
  const setNote = vi.fn();
  const applyAutoNotes = vi.fn();
  const setPublishedEventDates = vi.fn();
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
            publishedEventDates,
            setEvent,
            setGender,
            setNote,
            applyAutoNotes,
            setPublishedEventDates,
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

  it('hides the warning, disables generation and skips the history load until the event date is known', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.hasUnverified()).toBe(false);
    expect(fixture.nativeElement.querySelector('.preview__warning')).toBeNull();
    expect(fixture.nativeElement.querySelector('.preview__generate').disabled).toBe(true);
    expect(loadHistory, 'no event date yet — nothing to load').not.toHaveBeenCalled();
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

  it('auto-applies the history notes once the event date arrives and surfaces a load failure', async () => {
    let resolveHistory!: (history: AthletesHistory) => void;

    loadHistory.mockReturnValueOnce(new Promise((resolve) => (resolveHistory = resolve)));
    event.set(RACE_EVENT);
    fixture.detectChanges();

    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.loading);
    expect(fixture.nativeElement.querySelector('.preview__history-status').getAttribute('aria-live')).toBe('polite');
    expect(fixture.nativeElement.querySelector('.preview__history-status span')).not.toBeNull();

    resolveHistory(VALID_HISTORY);
    await settle();

    expect(applyAutoNotes).toHaveBeenCalledWith(VALID_HISTORY, RACE_EVENT.dateIso);
    expect(setPublishedEventDates, 'the loaded archive dates feed the auto race number').toHaveBeenCalledWith(EXPECTED_PUBLISHED_DATES);
    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.idle);

    event.set({ ...RACE_EVENT, dateIso: CHANGED_EVENT_DATE_ISO });
    fixture.detectChanges();

    expect(loadHistory, 'a date edit must not overwrite manual note fixes').toHaveBeenCalledTimes(1);

    fixture.destroy();
    loadHistory.mockRejectedValueOnce(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    fixture = TestBed.createComponent(PreviewPage);
    fixture.detectChanges();
    await settle();

    expect(fixture.componentInstance.historyStatus()).toBe(HistoryNotesStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.preview__history-error').getAttribute('role')).toBe('alert');
    expect(applyAutoNotes).toHaveBeenCalledTimes(1);
  });
});
