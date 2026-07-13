import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  NOTIFICATION_DISMISS_LABEL,
  NOTIFICATION_ERROR_DURATION_MS,
  NOTIFICATION_ERROR_PANEL_CLASS,
  NOTIFICATION_INFO_DURATION_MS,
  NOTIFICATION_INFO_PANEL_CLASS,
} from './notification.constant';
import { NotificationService } from './notification.service';
import { ERROR_TOAST_MESSAGE, INFO_TOAST_MESSAGE } from './notification.service.spec.mock';

describe('NotificationService', () => {
  const open = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { open } }],
    });
  });

  it('opens an error toast with the dismiss action and the error panel class', () => {
    TestBed.inject(NotificationService).error(ERROR_TOAST_MESSAGE);

    expect(open).toHaveBeenCalledWith(ERROR_TOAST_MESSAGE, NOTIFICATION_DISMISS_LABEL, {
      duration: NOTIFICATION_ERROR_DURATION_MS,
      panelClass: NOTIFICATION_ERROR_PANEL_CLASS,
    });
  });

  it('opens an info toast with the shorter duration and the info panel class', () => {
    TestBed.inject(NotificationService).info(INFO_TOAST_MESSAGE);

    expect(open).toHaveBeenCalledWith(INFO_TOAST_MESSAGE, NOTIFICATION_DISMISS_LABEL, {
      duration: NOTIFICATION_INFO_DURATION_MS,
      panelClass: NOTIFICATION_INFO_PANEL_CLASS,
    });
  });
});
