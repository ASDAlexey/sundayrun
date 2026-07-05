import { EVENT_DATE_ISO } from '../core/github/event-paths.mock';

/** jsDelivrFileUrl(eventFilePaths(EVENT_DATE_ISO).resultsJson): the branch-pinned CDN url of the results file. */
export const RESULTS_CDN_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/protocols@main/events/${EVENT_DATE_ISO}/results.json`;

/** Parses to null: valid JSON of an unexpected shape. */
export const FOREIGN_SCHEMA_TEXT = '{"schemaVersion":2}';
