import { DeltaBase, DeltaBaseType } from './delta-base.enum';
import { DeltaBaseStorage } from './delta-base.type';

/** localStorage key of the device-local «с чем сравнивать» pick (шестерёнка в шапке). */
export const DELTA_BASE_STORAGE_KEY = 'parkrun.deltaBase';

/**
 * The runner's own form is the default, so the key exists solely to record a move away from it —
 * an untouched device and a device switched back to «форма» read alike.
 */
export const DELTA_BASE_DEFAULT = DeltaBase.form;

/**
 * Class on `<html>` per non-default base. Every base's figure is in the markup at once and CSS
 * picks one (`race-page.scss`), the way the hundredths switch folds fractions away: hydration then
 * meets the structure the prerender wrote whatever this device picked. The inline script in
 * `index.html` sets the class before the first paint, so the column never flashes the wrong base.
 */
export const DELTA_BASE_CLASSES: Record<DeltaBaseType, string> = {
  [DeltaBase.form]: '',
  [DeltaBase.year]: 'delta-base-year',
  [DeltaBase.record]: 'delta-base-record',
  [DeltaBase.off]: 'delta-base-off',
};

/** Prerender has no localStorage; the server never knows the device, so a stub of the used subset suffices. */
export const DELTA_BASE_SSR_NOOP_STORAGE: DeltaBaseStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};
