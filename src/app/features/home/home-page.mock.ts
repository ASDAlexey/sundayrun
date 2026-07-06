import { STATS_HISTORY } from '../../core/history/overall-stats.mock';
import { AthletesHistory } from '../../core/models/athletes-history.type';

export {
  BAKED_RACE_ITEMS,
  EXPECTED_ANNOUNCE_TIME_TEXT,
  EXPECTED_RACE_ITEMS,
  EXPECTED_RACE_TITLES,
  INDEX_LOAD_ERROR_MESSAGE,
} from '../races/races-page.mock';

export const ATHLETES_LOAD_ERROR_MESSAGE = 'athletes history unreachable';

/** STATS_HISTORY rendered by the stats block, in template order: events, finishes, finishers, avg finishes, median time М/Ж. */
export const EXPECTED_STATS_VALUES = ['3', '8', '3', '2,7', '32:00', '30:00'];

/** Only the male finisher of STATS_HISTORY — the women's median has nothing to show. */
export const MEN_ONLY_HISTORY: AthletesHistory = { 'пётр сидоров': STATS_HISTORY['пётр сидоров'] };

/** MEN_ONLY_HISTORY rendered by the stats block: the missing women's median degrades to a dash. */
export const EXPECTED_MEN_ONLY_STATS_VALUES = ['3', '3', '1', '3,0', '32:00', '—'];
