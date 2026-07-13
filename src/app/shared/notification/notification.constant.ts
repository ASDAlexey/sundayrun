/** Info toasts auto-dismiss quickly; errors linger a touch longer so they can be read. */
export const NOTIFICATION_INFO_DURATION_MS = 4000;

export const NOTIFICATION_ERROR_DURATION_MS = 6000;

/** The dismiss action shown on every toast. */
export const NOTIFICATION_DISMISS_LABEL = $localize`:@@notification.dismiss:Закрыть`;

/** panelClass hooks the global snackbar styling in styles.scss to each variant. */
export const NOTIFICATION_ERROR_PANEL_CLASS = 'notification_error';

export const NOTIFICATION_INFO_PANEL_CLASS = 'notification_info';
