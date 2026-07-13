import { WEATHER_CODE_ICONS } from './weather-icon.constant';

/** The icon of a WMO weather code; an unknown or missing code renders no icon. */
export function weatherIconOf(weatherCode: number | null): string {
  if (weatherCode === null) {
    return '';
  }

  return WEATHER_CODE_ICONS.find((entry) => weatherCode <= entry.maxCode)?.icon ?? '';
}
