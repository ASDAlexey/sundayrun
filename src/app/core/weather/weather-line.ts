import { EventWeather } from './event-weather.interface';
import { temperatureText } from './temperature-text';
import { WET_COURSE_PRECIPITATION_MM } from './weather-api.constant';
import { WEATHER_PART_SEPARATOR } from './weather-line.constant';
import { weatherIconOf } from './weather-icon';

/**
 * «☀️ +26°, ветер 10 км/ч» — the stored 9:00 course weather as a single line, shared by the
 * protocol header and the race cards. The temperature anchors it: without a stored row, or with a
 * missing reading, the line is empty and the caller simply renders no weather at all. Rain in the
 * hours around the start adds «трасса мокрая»: the sky at 9:00 says nothing about the puddles a
 * night shower left on the asphalt.
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

  if (isWetCourse(weather)) {
    parts.push($localize`:@@race.weatherWetCourse:трасса мокрая`);
  }

  return parts.join(WEATHER_PART_SEPARATOR);
}

/**
 * Whether the course was still wet at the start: enough rain fell between the eve's 18:00 and 10:00
 * on race day. Events stored before the window was measured say nothing rather than «dry».
 */
export function isWetCourse(weather: EventWeather): boolean {
  return weather.recentPrecipitationMm !== null && weather.recentPrecipitationMm >= WET_COURSE_PRECIPITATION_MM;
}
