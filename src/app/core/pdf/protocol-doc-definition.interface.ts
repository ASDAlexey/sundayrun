import { PreviousBest } from '../history/previous-bests.interface';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { EventWeather } from '../weather/event-weather.interface';

/** Everything the protocol PDF draws; every field but the event and the rows is garnish that degrades to a blank. */
export interface ProtocolDocInput {
  event: RaceEvent;
  rows: ProtocolRow[];

  /** athleteKey → 5 km finishes as of the event, this one included; athletes outside the map get a blank «Участий» cell. */
  finishCounts: Record<string, number>;

  /** athleteKey → the best run before the event, dating the «ЛР (было X)» note; athletes outside the map keep the note as stored. */
  previousBests: Record<string, PreviousBest>;

  /** The stored 9:00 course reading; null (an event predating the fetch, or a failed read) draws no weather line. */
  weather: EventWeather | null;
}
