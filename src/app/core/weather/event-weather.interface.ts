/** The race-start-hour course weather of one event, as `event_weather` stores it; unmeasured readings stay null. */
export interface EventWeather {
  temperatureC: number | null;
  apparentC: number | null;
  precipitationMm: number | null;
  windKmh: number | null;
  weatherCode: number | null;
  /**
   * Millimetres of rain over the wet-course window (the eve's 18:00 → race day's 10:00), which the
   * start hour alone cannot tell: a downpour that stopped at dawn leaves 9:00 dry and the course
   * soaked. Null for events stored before this reading existed, or when the window has no data.
   */
  recentPrecipitationMm: number | null;
}
