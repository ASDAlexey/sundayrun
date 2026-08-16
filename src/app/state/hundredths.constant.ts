import { HundredthsStorage } from './hundredths.type';

/** localStorage key of the device-local «показывать сотые» pick (шестерёнка в шапке). */
export const HUNDREDTHS_STORAGE_KEY = 'parkrun.hundredths';

/**
 * The only value ever written. Hundredths are the default, so the key exists solely to record the
 * choice to switch them off — an untouched device and a device that switched them back on read alike.
 */
export const HUNDREDTHS_HIDDEN_VALUE = 'off';

/**
 * Class on `<html>` that folds every fraction away (`styles.scss`). The fraction stays in the markup
 * — hydration then sees the same structure the prerender wrote — and only stops taking up space.
 * The inline script in `index.html` sets the same class before the first paint, so a device that
 * turned hundredths off never sees them flash.
 */
export const HUNDREDTHS_HIDDEN_CLASS = 'hundredths-hidden';

/** Prerender has no localStorage; the server never knows the device, so a stub of the used subset suffices. */
export const HUNDREDTHS_SSR_NOOP_STORAGE: HundredthsStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};
