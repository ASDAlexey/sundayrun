import { AthleteWeatherBests } from '../../core/history/weather-records.interface';

/** The bucket rows in display order, each with its icon and label; a null best hides its row. */
export const WEATHER_BUCKETS: readonly { key: keyof AthleteWeatherBests; icon: string; label: string }[] = [
  { key: 'rain', icon: '🌧', label: $localize`:@@athlete.weatherRain:В дождь` },
  { key: 'snow', icon: '🌨', label: $localize`:@@athlete.weatherSnow:В снег` },
  { key: 'frost', icon: '❄️', label: $localize`:@@athlete.weatherFrost:В мороз` },
  { key: 'heat', icon: '🔥', label: $localize`:@@athlete.weatherHeat:В жару` },
];
