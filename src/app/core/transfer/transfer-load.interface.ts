/** How a page consumes `loadWithTransfer`: fetch the data, apply it to signals, react to a failure. */
export interface TransferLoadOptions<T> {
  /** Unique per page and resource; the prerendered value travels under this key in the `ng-state` script. */
  key: string;
  load: () => Promise<T>;
  apply: (data: T) => void;
  /** Called only in the browser and only when no prerendered value is already on screen. */
  onError: () => void;
  /**
   * Skip the browser refresh when a prerendered value is already on screen. The db is bundled into
   * the same Pages deploy as the prerendered HTML, so a fresh page load's baked value already equals
   * what the refetch would return — the reads are pure waste. The only case it forgoes is a stale
   * browser-cached HTML across a deploy; pages whose data changes at deploy cadence (the home
   * preview and totals) trade that rare, at-most-one-cache-window staleness for far fewer requests.
   */
  trustBaked?: boolean;
}
