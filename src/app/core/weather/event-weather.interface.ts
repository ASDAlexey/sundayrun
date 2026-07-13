/** The race-start-hour course weather of one event, as `event_weather` stores it; unmeasured readings stay null. */
export interface EventWeather {
  temperatureC: number | null;
  apparentC: number | null;
  precipitationMm: number | null;
  windKmh: number | null;
  weatherCode: number | null;
}
