import { PageMetaTag } from './page-meta.interface';

/**
 * The headline every page falls back to: the site title `index.html` ships with. A route always
 * resolves a title of its own, so this only ever stands in for the componentless redirects.
 */
export const DEFAULT_PAGE_TITLE = $localize`:@@meta.defaultTitle:Воскресный парковый пробег в Таганроге — протоколы и результаты`;

/**
 * The sentence a page that says nothing about itself is described with — the same one `index.html`
 * ships in `description`. Kept as the reset between routes so a shared link never inherits the
 * previous page's sentence.
 */
export const DEFAULT_PAGE_DESCRIPTION = $localize`:@@meta.defaultDescription:Результаты и PDF-протоколы Воскресного паркового пробега в Таганроге (ПКиО им. Горького). История и личная статистика каждого участника. Организатор — КЛБ «Легенда».`;

/** Where the preview links back to; kept identical to `<link rel="canonical">`. */
export const PAGE_URL_META_TAG: PageMetaTag = { attribute: 'property', value: 'og:url' };

/** Both preview headlines, so Telegram/VK and X read the same route title. */
export const PAGE_TITLE_META_TAGS: readonly PageMetaTag[] = [
  { attribute: 'property', value: 'og:title' },
  { attribute: 'name', value: 'twitter:title' },
];

/** The crawler's `description` and both preview subtitles, which always carry the same sentence. */
export const PAGE_DESCRIPTION_META_TAGS: readonly PageMetaTag[] = [
  { attribute: 'name', value: 'description' },
  { attribute: 'property', value: 'og:description' },
  { attribute: 'name', value: 'twitter:description' },
];

/** Joins the optional clauses of a page's sentence: «… у мужчин 24:00,00, у женщин 27:00,00». */
export const PAGE_META_CLAUSE_SEPARATOR = ', ';
