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

  it('opens, exports, shares and publishes the row from its action sheet', async () => {
    sessions.sessions.set(TIMER_SESSION_LIST);
    await fixture.whenStable();

    const opened = vi.fn();

    fixture.componentInstance.open.subscribe(opened);

    const element = await openMenu();

    expect(element.querySelector('.timer-sessions__sheet'), 'the actions come up over the screen, not inside the card').not.toBeNull();
    expect(element.querySelector('.timer-sessions__sheet-title')?.textContent?.trim(), 'and the sheet says which race').toBe(
      TIMER_ROW_DATE_TEXT,
    );

    element.querySelector<HTMLButtonElement>('.timer-sessions__scrim')?.click();
    await fixture.whenStable();

    expect(element.querySelector('.timer-sessions__sheet'), 'a tap outside closes it').toBeNull();

    await openMenu();
    element.querySelector<HTMLButtonElement>('.timer-sessions__sheet-close')?.click();
    await fixture.whenStable();

    expect(element.querySelector('.timer-sessions__sheet'), 'and so does «×»').toBeNull();

    await openMenu();
    element.querySelector('.timer-sessions__dialog')?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    await fixture.whenStable();

    expect(element.querySelector('.timer-sessions__sheet'), 'Escape is the third way out').toBeNull();

    (await openMenu()).querySelector<HTMLButtonElement>('.timer-sessions__menu-item')?.click();
    await fixture.whenStable();

    expect(opened).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_ID);
    expect(element.querySelector('.timer-sessions__sheet'), 'the sheet closes behind the action').toBeNull();

    const items = [...(await openMenu()).querySelectorAll<HTMLElement>('.timer-sessions__menu-item')];

    items[1].click();

    const exported = vi.mocked(URL.createObjectURL).mock.calls[0][0];

    expect(exported instanceof File && exported.name).toBe(TIMER_ROW_FILE_NAME);
    expect(HTMLAnchorElement.prototype.click, 'the workbook is saved through a transient anchor').toHaveBeenCalledOnce();

    (await openMenu()).querySelectorAll<HTMLElement>('.timer-sessions__menu-item')[2].click();
    await fixture.whenStable();

    expect(shareFile.mock.calls[0][1]).toBe(TIMER_ROW_DATE_TEXT);
    expect(vi.mocked(URL.createObjectURL), 'a shared file is never downloaded as well').toHaveBeenCalledOnce();

    canShareFile.mockReturnValue(false);
    (await openMenu()).querySelectorAll<HTMLElement>('.timer-sessions__menu-item')[2].click();
    await fixture.whenStable();

    expect(shareFile, 'no sheet for files means the file is saved instead').toHaveBeenCalledOnce();
    expect(vi.mocked(URL.createObjectURL)).toHaveBeenCalledTimes(2);

    (await openMenu()).querySelectorAll<HTMLElement>('.timer-sessions__menu-item')[3].click();

    expect(publish.publish).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_FINISHED);

    isAdmin.set(false);

    const guestItems = [...(await openMenu()).querySelectorAll('.timer-sessions__menu-item')];

    expect(guestItems[3].getAttribute('href')).toBe(TIMER_ROW_ADMIN_HREF);
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
