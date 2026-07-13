/**
 * One event published in this browser but not yet served by the archive db — rendered as a
 * «публикуется…» placeholder row on /admin until the rebuild propagates.
 */
export interface PendingUpload {
  /** The event slug (its ISO date); matches the archive entry once the rebuild lands. */
  slug: string;
  number: number;
  dateIso: string;
  participantCount: number;
  /** ISO publish time; a backstop prunes entries that outlive the propagation window. */
  atIso: string;
}

/** One event deleted in this browser but still served by the stale session db — hidden from the /admin list. */
export interface PendingDeletion {
  slug: string;
  /** ISO deletion time; a backstop prunes entries that outlive the propagation window. */
  atIso: string;
}

/** The two out-of-band changes the session made before the archive db caught up. */
export interface PendingArchiveChanges {
  uploads: PendingUpload[];
  deletions: PendingDeletion[];
}
