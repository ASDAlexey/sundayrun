import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TIMER_SESSION_FINISHED } from '../../../core/timer/timer-session.mock';
import { ShareService } from '../../../share/share.service';
import { TimerShare } from './session-share';
import { TIMER_SHARE_COPIED_MS } from './session-share.constant';
import {
  SHARE_FILE_NAME,
  SHARE_MAX_URL,
  SHARE_OBJECT_URL,
  SHARE_RACE_LINK,
  SHARE_SITE_LINK,
  SHARE_SLUG,
  SHARE_TELEGRAM_URL,
  ShareServiceMock,
  shareServiceMock,
} from './session-share.mock';

describe('TimerShare', () => {
  let fixture: ComponentFixture<TimerShare>;
  let share: ShareServiceMock;

  const element = (): HTMLElement => fixture.nativeElement;
  const chats = (): HTMLElement[] => [...element().querySelectorAll<HTMLElement>('.timer-share__chat')];
  const press = async (selector: string): Promise<void> => {
    element().querySelector<HTMLElement>(selector)?.click();
    await fixture.whenStable();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(SHARE_OBJECT_URL);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    share = shareServiceMock();
    TestBed.configureTestingModule({ providers: [{ provide: ShareService, useValue: share }] });
    fixture = TestBed.createComponent(TimerShare);
    fixture.componentRef.setInput('session', TIMER_SESSION_FINISHED);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends the workbook through the system sheet and the message to both chats', async () => {
    await fixture.whenStable();

    expect(element().querySelector('.timer-share__action-note')?.textContent?.trim(), 'the file name is spelled out').toBe(SHARE_FILE_NAME);

    await press('.timer-share__action_lead');

    const [file, title] = share.shareFile.mock.calls[0];

    expect(file instanceof File && file.name).toBe(SHARE_FILE_NAME);
    expect(title, 'the system sheet is titled with the race date').toBeTruthy();
    expect(URL.createObjectURL, 'a shared file is never downloaded as well').not.toHaveBeenCalled();

    await press('.timer-share__action:not(.timer-share__action_lead)');

    expect(HTMLAnchorElement.prototype.click, '«Сохранить в файлы» always saves').toHaveBeenCalledOnce();

    chats()[0].click();
    chats()[1].click();
    await fixture.whenStable();

    expect(share.buildTelegramShareUrl.mock.calls[0][0], 'an unpublished race links to the site itself').toBe(SHARE_SITE_LINK);
    expect(share.buildTelegramShareUrl.mock.calls[0][1], 'and Telegram takes the link apart from the body').not.toContain(SHARE_SITE_LINK);
    expect(share.buildMaxShareUrl.mock.calls[0][0], 'MAX carries text alone, so the link rides inside it').toBeTruthy();
    expect(share.openWindow.mock.calls.map(([url]) => url)).toEqual([SHARE_TELEGRAM_URL, SHARE_MAX_URL]);
  });

  it('downloads instead of sharing where files cannot travel, and links the protocol once it has a page', async () => {
    share.canShareFile.mockReturnValue(false);
    fixture.componentRef.setInput('raceSlug', SHARE_SLUG);
    await fixture.whenStable();

    expect(element().querySelectorAll('.timer-share__action'), 'no system sheet, so no second «сохранить»').toHaveLength(1);

    await press('.timer-share__action_lead');

    expect(share.shareFile).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click, 'the workbook is saved through a transient anchor').toHaveBeenCalledOnce();

    await press('.timer-share__chat');

    expect(share.buildTelegramShareUrl.mock.calls[0][0]).toBe(SHARE_RACE_LINK);
    expect(element().querySelector('.timer-share__preview')?.textContent, 'and the message carries the address too').toContain(
      SHARE_RACE_LINK,
    );
  });

  it('answers a copied message with a tick that goes away, and claims nothing when the clipboard refused', async () => {
    await fixture.whenStable();

    const copy = chats()[2];
    const done = (): boolean => copy.classList.contains('timer-share__chat_done');

    // Installed only around this press: the sheet renders through `afterNextRender`, and faking the
    // clock before that leaves `whenStable()` waiting for a frame that will never be scheduled.
    vi.useFakeTimers();
    copy.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(share.copyToClipboard).toHaveBeenCalledOnce();
    expect(done(), 'the key answers with a tick').toBe(true);

    await vi.advanceTimersByTimeAsync(TIMER_SHARE_COPIED_MS);
    fixture.detectChanges();

    expect(done(), 'and goes back to its own label').toBe(false);

    share.copyToClipboard.mockResolvedValue(false);
    copy.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(done(), 'a refused write must not claim success').toBe(false);
  });
});
