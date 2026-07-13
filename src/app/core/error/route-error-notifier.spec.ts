import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { NotificationService } from '../../shared/notification/notification.service';
import { notificationMock } from '../../shared/notification/notification.service.mock';
import { STALE_CHUNK_ERROR, UNRELATED_ERROR } from './lazy-chunk-reload.mock';
import { RouteErrorNotifier } from './route-error-notifier';
import { NAVIGATION_ERROR_MESSAGE, STALE_CHUNK_RELOAD_FAILED_MESSAGE } from './route-error-notifier.constant';

describe('RouteErrorNotifier', () => {
  const events = new Subject<NavigationEnd | NavigationError>();
  const notification = notificationMock();
  const reload = vi.fn();
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('location', { reload });
    vi.stubGlobal('sessionStorage', { getItem, setItem });
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    TestBed.inject(RouteErrorNotifier);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reloads once on a stale chunk without a toast, since the reload recovers the shell', () => {
    events.next(new NavigationError(1, '/result', STALE_CHUNK_ERROR));

    expect(reload).toHaveBeenCalledOnce();
    expect(notification.error).not.toHaveBeenCalled();
  });

  it('toasts when a stale-chunk reload already fired yet the load still fails', () => {
    // A stamp at «now» keeps the loop guard closed, so no second reload — the deploy itself is broken.
    getItem.mockImplementation(() => String(Date.now()));

    events.next(new NavigationError(2, '/result', STALE_CHUNK_ERROR));

    expect(reload).not.toHaveBeenCalled();
    expect(notification.error).toHaveBeenCalledWith(STALE_CHUNK_RELOAD_FAILED_MESSAGE);
  });

  it('toasts a generic message for any other navigation error and ignores non-error events', () => {
    events.next(new NavigationEnd(3, '/records', '/records'));

    expect(notification.error, 'a successful navigation is not an error').not.toHaveBeenCalled();

    events.next(new NavigationError(4, '/records', UNRELATED_ERROR));

    expect(reload, 'a non-chunk error never reloads').not.toHaveBeenCalled();
    expect(notification.error).toHaveBeenCalledWith(NAVIGATION_ERROR_MESSAGE);
  });
});
