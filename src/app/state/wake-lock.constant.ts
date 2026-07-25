/** The only lock the API knows about: keep the screen lit. */
export const WAKE_LOCK_SCREEN = 'screen';

/** The system drops the lock whenever the tab leaves the foreground, and says so with this event. */
export const VISIBILITY_CHANGE_EVENT = 'visibilitychange';

/** The state a document reports while it is the one on screen. */
export const DOCUMENT_VISIBLE = 'visible';
