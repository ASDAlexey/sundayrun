import { ATHLETES_PAGE_LINK, NO_BEST_TIME_TEXT } from './athletes-page.constant';
import { AthleteListItem } from './athletes-page.interface';

/** `EXPECTED_ROLLUP_HISTORY` items in the default order: fastest 5 km best first, no best last. */
export const EXPECTED_BEST_TIME_ITEMS: AthleteListItem[] = [
  {
    key: 'новиков олег',
    link: [ATHLETES_PAGE_LINK, 'новиков олег'],
    displayName: 'Новиков Олег',
    participationCount: 2,
    bestTimeText: '23:20',
  },
  {
    key: 'иванов иван',
    link: [ATHLETES_PAGE_LINK, 'иванов иван'],
    displayName: 'Иванов Иван',
    participationCount: 3,
    bestTimeText: '24:00',
  },
  {
    key: 'елкина алена',
    link: [ATHLETES_PAGE_LINK, 'елкина алена'],
    displayName: 'Ёлкина Алёна',
    participationCount: 3,
    bestTimeText: '25:00',
  },
  {
    key: 'сошедший атлет',
    link: [ATHLETES_PAGE_LINK, 'сошедший атлет'],
    displayName: 'Сошедший Атлет',
    participationCount: 1,
    bestTimeText: NO_BEST_TIME_TEXT,
  },
];

/** Most participations first, the 3-participation tie broken by name ('Ё' sorts before 'И' in Russian). */
export const EXPECTED_PARTICIPATION_KEYS = ['елкина алена', 'иванов иван', 'новиков олег', 'сошедший атлет'];

/** Denormalized on purpose: matches 'елкина алена' only after key normalization. */
export const ATHLETES_SEARCH_QUERY = ' Ёлкина ';

export const EXPECTED_SEARCH_KEYS = ['елкина алена'];

export const ATHLETES_NO_MATCH_QUERY = 'нет такого';

export const ATHLETES_LOAD_ERROR_MESSAGE = 'athletes history load failed';
