export const CDN_FILE_PATH = 'events/2026-06-28/protocol.pdf';

export const PINNED_REF = 'commit-sha';

export const EXPECTED_BRANCH_CDN_URL = 'https://cdn.jsdelivr.net/gh/ASDAlexey/protocols@main/events/2026-06-28/protocol.pdf';

export const EXPECTED_PINNED_CDN_URL = 'https://cdn.jsdelivr.net/gh/ASDAlexey/protocols@commit-sha/events/2026-06-28/protocol.pdf';

export const PURGE_PATHS = ['index.json', 'athletes.json'];

export const EXPECTED_PURGE_URLS = [
  'https://purge.jsdelivr.net/gh/ASDAlexey/protocols@main/index.json',
  'https://purge.jsdelivr.net/gh/ASDAlexey/protocols@main/athletes.json',
];

export const SERVER_ERROR_STATUS = 500;
