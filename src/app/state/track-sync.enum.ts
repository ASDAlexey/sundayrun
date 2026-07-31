/** What the silent sync is doing right now, as the profile card shows it. */
export const TrackSyncStatus = {
  idle: 'idle',
  syncing: 'syncing',
  /** The provider refused the token — the link is gone and the password is needed once more. */
  expired: 'expired',
  failed: 'failed',
} as const;

export type TrackSyncStatusType = (typeof TrackSyncStatus)[keyof typeof TrackSyncStatus];
