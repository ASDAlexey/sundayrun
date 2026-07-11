import { EventFilePaths } from './event-paths.interface';
import { EVENTS_DIRECTORY, RESULTS_JSON_FILE, SOURCE_XLSX_FILE } from './protocols-repo.constant';

/** Repository paths of the per-event files, all under `events/<dateIso>/`. */
export function eventFilePaths(dateIso: string): EventFilePaths {
  const eventDirectory = `${EVENTS_DIRECTORY}${dateIso}/`;

  return {
    sourceXlsx: `${eventDirectory}${SOURCE_XLSX_FILE}`,
    resultsJson: `${eventDirectory}${RESULTS_JSON_FILE}`,
  };
}
