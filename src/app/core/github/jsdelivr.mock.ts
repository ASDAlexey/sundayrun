export const CDN_FILE_PATH = 'data/events/2026-06-28/protocol.pdf';

export const PINNED_REF = 'commit-sha';

export const EXPECTED_BRANCH_CDN_URL = 'https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/events/2026-06-28/protocol.pdf';

export const EXPECTED_PINNED_CDN_URL = 'https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@commit-sha/data/events/2026-06-28/protocol.pdf';

export const PURGE_PATHS = ['data/index.json', 'data/athletes.json'];

export const EXPECTED_PURGE_URLS = [
  'https://purge.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/index.json',
  'https://purge.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/athletes.json',
];

export const SERVER_ERROR_STATUS = 500;
