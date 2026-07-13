import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  NOTIFICATION_DISMISS_LABEL,
  NOTIFICATION_ERROR_DURATION_MS,
  NOTIFICATION_ERROR_PANEL_CLASS,
  NOTIFICATION_INFO_DURATION_MS,
  NOTIFICATION_INFO_PANEL_CLASS,
} from './notification.constant';

/** One-off Material toasts (MatSnackBar) for surfacing errors and short status notices app-wide. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly #snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.#snackBar.open(message, NOTIFICATION_DISMISS_LABEL, {
      duration: NOTIFICATION_ERROR_DURATION_MS,
      panelClass: NOTIFICATION_ERROR_PANEL_CLASS,
    });
  }

  info(message: string): void {
    this.#snackBar.open(message, NOTIFICATION_DISMISS_LABEL, {
      duration: NOTIFICATION_INFO_DURATION_MS,
      panelClass: NOTIFICATION_INFO_PANEL_CLASS,
    });
  }
}
