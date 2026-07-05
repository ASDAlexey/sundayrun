/** How a page consumes `loadWithTransfer`: fetch the data, apply it to signals, react to a failure. */
export interface TransferLoadOptions<T> {
  /** Unique per page and resource; the prerendered value travels under this key in the `ng-state` script. */
  key: string;
  load: () => Promise<T>;
  apply: (data: T) => void;
  /** Called only in the browser and only when no prerendered value is already on screen. */
  onError: () => void;
}
