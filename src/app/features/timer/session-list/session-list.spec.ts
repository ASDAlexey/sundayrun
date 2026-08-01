import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { isoToday } from '../../../core/time/iso-today';
import { TIMER_SESSION_FINISHED, TIMER_SESSION_ID } from '../../../core/timer/timer-session.mock';
import { AdminTokenService } from '../../../github/admin-token.service';
import { ShareService } from '../../../share/share.service';
import { TimerPublishService } from '../../../state/timer-publish.service';
import { timerPublishServiceMock } from '../../../state/timer-publish.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerSessions } from './session-list';
import {
  TIMER_EXPORT_OBJECT_URL,
  TIMER_ROW_ADMIN_HREF,
  TIMER_ROW_CLEAN_META_TEXT,
  TIMER_ROW_DATE_TEXT,
  TIMER_ROW_FILE_NAME,
  TIMER_ROW_META_TEXT,
  TIMER_ROW_REMOVE_NOTE,
  TIMER_ROW_STATUS_TEXTS,
  TIMER_SESSION_LIST,
} from './session-list.mock';

describe('TimerSessions', () => {
  const isAdmin = signal(true);
  const canShareFile = vi.fn<(file: File) => boolean>();
  const shareFile = vi.fn<(file: File, title: string, text: string) => Promise<boolean>>();

  let sessions: TimerSessionServiceMock;
  let publish: ReturnType<typeof timerPublishServiceMock>;
  let fixture: ComponentFixture<TimerSessions>;

  /** Opens the newest row's action sheet and hands back the rendered root. */
  const openMenu = async (): Promise<HTMLElement> => {
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('.timer-sessions__menu')?.click();
    await fixture.whenStable();

    return element;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(TIMER_EXPORT_OBJECT_URL);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    isAdmin.set(true);
    canShareFile.mockReturnValue(true);
    shareFile.mockResolvedValue(true);
    sessions = timerSessionServiceMock();
    publish = timerPublishServiceMock();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerPublishService, useValue: publish },
        { provide: AdminTokenService, useValue: { isAdmin } },
        { provide: ShareService, useValue: { canShareFile, shareFile } },
      ],
    });
    fixture = TestBed.createComponent(TimerSessions);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('invites the first measurement when nothing was ever timed', async () => {
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-sessions__empty-title')).not.toBeNull();
    expect(element.querySelector('.timer-sessions__list'), 'no list, no rows').toBeNull();

    element.querySelector<HTMLButtonElement>('.timer-sessions__new')?.click();

    expect(sessions.create).toHaveBeenCalledExactlyOnceWith({ dateIso: isoToday() });
  });

  it('shows every measurement with its date, counters and status', async () => {
    sessions.sessions.set(TIMER_SESSION_LIST);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const statuses = [...element.querySelectorAll('.timer-sessions__status')];
    const metas = [...element.querySelectorAll('.timer-sessions__meta')];

    expect(element.querySelector('.timer-sessions__date')?.textContent?.trim()).toBe(TIMER_ROW_DATE_TEXT);
    expect(metas[0].textContent?.trim()).toBe(TIMER_ROW_META_TEXT);
    expect(metas.at(-1)?.textContent?.trim(), 'a sorted-out measurement says nothing about unnamed times').toBe(TIMER_ROW_CLEAN_META_TEXT);
    expect(statuses.map((status) => status.textContent?.trim())).toEqual(TIMER_ROW_STATUS_TEXTS);
    expect(statuses[1].classList.contains('timer-sessions__status_published')).toBe(true);
    expect(statuses[2].classList.contains('timer-sessions__status_failed')).toBe(true);
    expect(element.querySelectorAll('.timer-sessions__item_pending').length, 'the publishing row is marked').toBe(1);
    expect(element.querySelector('.timer-sessions__empty'), 'the invitation is gone').toBeNull();
  });

  it('opens, sends and publishes the row from its action sheet', async () => {
    sessions.sessions.set(TIMER_SESSION_LIST);
    await fixture.whenStable();

    const opened = vi.fn();

    fixture.componentInstance.open.subscribe(opened);

    const element = await openMenu();
    const sheet = (): HTMLDialogElement | null => element.querySelector('dialog.timer-sessions__sheet');

    expect(sheet()?.open, 'the actions come up as a platform modal over the screen, not inside the card').toBe(true);
    expect(fixture.nativeElement.ownerDocument.activeElement, 'and the focus is inside it, so Escape needs no Tab first').toBe(sheet());
    expect(element.querySelector('.timer-sessions__scrim'), 'the hand-rolled scrim button is gone with the wrapper').toBeNull();
    expect(element.querySelector('.timer-sessions__sheet-title')?.textContent?.trim(), 'and the sheet says which race').toBe(
      TIMER_ROW_DATE_TEXT,
    );

    sheet()?.dispatchEvent(new MouseEvent('click'));
    await fixture.whenStable();

    expect(sheet(), 'a tap outside is reported as a click on the dialog itself').toBeNull();

    await openMenu();

    const closedByHand = sheet();

    element.querySelector<HTMLButtonElement>('.timer-sessions__sheet-close')?.click();
    await fixture.whenStable();

    expect(closedByHand?.open, '«×» closes the dialog by hand, so the focus goes back to the «⋮» of the row').toBe(false);
    expect(sheet(), 'and the row lets go of its menu').toBeNull();

    await openMenu();
    sheet()?.dispatchEvent(new Event('cancel'));
    await fixture.whenStable();

    expect(sheet(), 'Escape is the third way out').toBeNull();

    (await openMenu()).querySelector<HTMLButtonElement>('.timer-sessions__menu-item')?.click();
    await fixture.whenStable();

    expect(opened).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_ID);
    expect(element.querySelector('.timer-sessions__sheet'), 'the sheet closes behind the action').toBeNull();

    (await openMenu()).querySelectorAll<HTMLElement>('.timer-sessions__menu-item')[1].click();
    await fixture.whenStable();

    expect(element.querySelector('.timer-share'), '«Отправить забег» hands the row to the share sheet').not.toBeNull();
    expect(element.querySelector('.timer-share__action-note')?.textContent?.trim(), 'and the sheet names the workbook').toBe(
      TIMER_ROW_FILE_NAME,
    );

    element.querySelector<HTMLElement>('.timer-share__action')?.click();
    await fixture.whenStable();

    expect(shareFile.mock.calls[0][1], 'the system sheet carries the file itself where it can').toBe(TIMER_ROW_DATE_TEXT);

    element.querySelector<HTMLElement>('.timer-share')?.click();
    await fixture.whenStable();

    expect(element.querySelector('.timer-share'), 'and the sheet closes behind it').toBeNull();

    (await openMenu()).querySelectorAll<HTMLElement>('.timer-sessions__menu-item')[2].click();

    expect(publish.publish).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_FINISHED);

    isAdmin.set(false);

    const guestItems = [...(await openMenu()).querySelectorAll('.timer-sessions__menu-item')];

    expect(guestItems[2].getAttribute('href')).toBe(TIMER_ROW_ADMIN_HREF);
  });

  it('asks what exactly disappears before it deletes a measurement', async () => {
    sessions.sessions.set(TIMER_SESSION_LIST);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const dialog = (): HTMLDialogElement | null => element.querySelector('dialog.timer-confirm');
    const ask = async (): Promise<void> => {
      element.querySelector<HTMLElement>('.timer-sessions__menu-item_danger')?.click();
      await fixture.whenStable();
    };

    await openMenu();
    await ask();

    expect(dialog()?.open).toBe(true);
    expect(dialog()?.querySelector('.timer-confirm__note')?.textContent, 'the question spells out the date and the counters').toBe(
      TIMER_ROW_REMOVE_NOTE,
    );

    dialog()?.querySelector<HTMLElement>('.timer-confirm__cancel')?.click();
    await fixture.whenStable();

    expect(sessions.remove, '«Отмена» keeps the measurement').not.toHaveBeenCalled();
    expect(element.querySelector('.timer-sessions__sheet'), 'and lands back on the sheet it was asked from').not.toBeNull();

    await ask();
    dialog()?.querySelector<HTMLElement>('.timer-confirm__action')?.click();
    await fixture.whenStable();

    expect(sessions.remove).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_ID);
    expect(element.querySelector('.timer-sessions__sheet'), 'the sheet goes with the measurement').toBeNull();
  });
});
