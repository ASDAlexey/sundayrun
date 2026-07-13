/** One weather-bucket best prepared for the template: «🌧 В дождь · 22:41 · +18° · дата-ссылка». */
export interface WeatherBestView {
  key: string;
  icon: string;
  label: string;
  timeText: string;
  /** The start-hour temperature of that race; empty when the reading is missing. */
  temperatureText: string;
  dateShort: string;
  raceLink: string[];
}
