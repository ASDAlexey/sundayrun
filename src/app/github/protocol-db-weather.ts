import { asc, eq } from 'drizzle-orm';

import { EventWeatherRow } from '../core/history/weather-records.interface';
import { eventWeather } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { EventWeather } from '../core/weather/event-weather.interface';

/** The `event_weather` reads, split out of `protocol-db-queries.ts` the way the season selects are. */

/**
 * The whole `event_weather` table, slug-ascending — a few hundred tiny rows, so the weather
 * extremes on the records page and the athlete's weather bests share one read.
 */
export function selectEventWeatherRows(db: ProtocolDrizzle): Promise<EventWeatherRow[]> {
  return db
    .select({
      slug: eventWeather.slug,
      temperatureC: eventWeather.temperatureC,
      apparentC: eventWeather.apparentC,
      precipitationMm: eventWeather.precipitationMm,
      windKmh: eventWeather.windKmh,
      weatherCode: eventWeather.weatherCode,
    })
    .from(eventWeather)
    .orderBy(asc(eventWeather.slug));
}

/** The 9:00 course weather stored for one event; null when the event predates the fetch or it failed. */
export async function selectEventWeather(db: ProtocolDrizzle, slug: string): Promise<EventWeather | null> {
  const [row] = await db
    .select({
      temperatureC: eventWeather.temperatureC,
      apparentC: eventWeather.apparentC,
      precipitationMm: eventWeather.precipitationMm,
      windKmh: eventWeather.windKmh,
      weatherCode: eventWeather.weatherCode,
    })
    .from(eventWeather)
    .where(eq(eventWeather.slug, slug));

  return row ?? null;
}
