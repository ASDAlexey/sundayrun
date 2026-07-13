import { POSITIVE_TEMPERATURE_SIGN, TEMPERATURE_SUFFIX } from './temperature-text.constant';

/** «+26°», «0°», «-5°» — rounded, with the explicit plus of above-zero readings. */
export function temperatureText(temperatureC: number): string {
  const rounded = Math.round(temperatureC);
  const sign = rounded > 0 ? POSITIVE_TEMPERATURE_SIGN : '';

  return `${sign}${rounded}${TEMPERATURE_SUFFIX}`;
}
