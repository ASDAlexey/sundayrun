/** «В мороз» — the 9:00 start-hour temperature at or below freezing. */
export const FROST_MAX_TEMPERATURE_C = 0;

/** «В жару» — the 9:00 start-hour temperature at or above the summer cut. */
export const HEAT_MIN_TEMPERATURE_C = 25;

/** WMO codes of drizzle, rain, rain showers and thunderstorms — the «в дождь» events. */
export const RAIN_WEATHER_CODES: ReadonlySet<number> = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

/** WMO codes of snowfall, snow grains and snow showers — the «в снег» events. */
export const SNOW_WEATHER_CODES: ReadonlySet<number> = new Set([71, 73, 75, 77, 85, 86]);
