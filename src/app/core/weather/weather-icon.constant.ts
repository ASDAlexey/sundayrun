/** WMO weather-code ceilings → icons, ascending; the first ceiling at or above the code wins. */
export const WEATHER_CODE_ICONS: readonly { maxCode: number; icon: string }[] = [
  { maxCode: 0, icon: '☀️' },
  { maxCode: 2, icon: '🌤️' },
  { maxCode: 3, icon: '☁️' },
  { maxCode: 48, icon: '🌫️' },
  { maxCode: 57, icon: '🌦️' },
  { maxCode: 67, icon: '🌧️' },
  { maxCode: 79, icon: '🌨️' },
  { maxCode: 82, icon: '🌧️' },
  { maxCode: 86, icon: '🌨️' },
  { maxCode: 99, icon: '⛈️' },
];
