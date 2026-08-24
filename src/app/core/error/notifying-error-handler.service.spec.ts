import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { consoleErrorSpy, resetConsoleSpies } from 'vitest-auto-spy/console';

import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../../features/spec-utils/platform.mock';
import { NotificationService } from '../../shared/notification/notification.service';
import { notificationMock } from '../../shared/notification/notification.service.mock';
import { UNEXPECTED_ERROR_MESSAGE } from './notifying-error-handler.constant';
import { NotifyingErrorHandler } from './notifying-error-handler.service';
import { HANDLED_ERROR } from './notifying-error-handler.spec.mock';

describe('NotifyingErrorHandler', () => {
  const notification = notificationMock();
  let platformId = BROWSER_PLATFORM_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    // The base handler logs to the console for debugging; the imported spy already silences it.
    resetConsoleSpies();
    TestBed.configureTestingModule({
      providers: [
        NotifyingErrorHandler,
        { provide: NotificationService, useValue: notification },
        { provide: PLATFORM_ID, useFactory: (): typeof platformId => platformId },
      ],
    });
  });

  it('logs the error through the base handler and surfaces a toast in the browser', () => {
    TestBed.inject(NotifyingErrorHandler).handleError(HANDLED_ERROR);

    expect(consoleErrorSpy, 'the default handler still logs for debugging').toHaveBeenCalled();
    expect(notification.error).toHaveBeenCalledWith(UNEXPECTED_ERROR_MESSAGE);
  });

  it('logs but shows no toast during prerender', () => {
    platformId = SERVER_PLATFORM_ID;

    TestBed.inject(NotifyingErrorHandler).handleError(HANDLED_ERROR);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(notification.error, 'no snackbar without a browser').not.toHaveBeenCalled();
  });
});
