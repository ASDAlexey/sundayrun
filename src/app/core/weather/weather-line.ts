import { EventWeather } from './event-weather.interface';
import { temperatureText } from './temperature-text';
import { WEATHER_PART_SEPARATOR } from './weather-line.constant';
import { weatherIconOf } from './weather-icon';

/**
 * «☀️ +26°, ветер 10 км/ч» — the stored 9:00 course weather as a single line, shared by the
 * protocol header and the race cards. The temperature anchors it: without a stored row, or with a
 * missing reading, the line is empty and the caller simply renders no weather at all.
 */
export function weatherLineText(weather: EventWeather | null): string {
  if (weather === null) {
    return '';
  }

  if (weather.temperatureC === null) {
    return '';
  }

  const icon = weatherIconOf(weather.weatherCode);
  const parts = [`${icon} ${temperatureText(weather.temperatureC)}`.trim()];

  if (weather.windKmh !== null) {
    const windKmh = Math.round(weather.windKmh);

    parts.push($localize`:@@race.weatherWind:ветер ${windKmh}:windKmh: км/ч`);
  }

  return parts.join(WEATHER_PART_SEPARATOR);
}
