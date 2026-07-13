import { RECORDS_PAGE_LINK, RECORDS_VIEW_QUERY_PARAM } from '../records/records-page.constant';
import { RecordsView } from '../records/records-page.enum';

/** One card per explained feature: короли, первый круг, гонка за сезон, рейтинг, до следующего места, легенда, серии, раж, бейджи, итоги, дуэли, соперники, мем-пороги, форма, цифры, погода, график. */
export const EXPECTED_GUIDE_CARD_COUNT = 17;

/** The season-race card deep-links straight into the chart view of the records page. */
export const EXPECTED_CHART_LINK_HREF = `${RECORDS_PAGE_LINK}?${RECORDS_VIEW_QUERY_PARAM}=${RecordsView.chart}`;

/** The rating card deep-links straight into the combined М+Ж board. */
export const EXPECTED_RATING_LINK_HREF = `${RECORDS_PAGE_LINK}?${RECORDS_VIEW_QUERY_PARAM}=${RecordsView.rating}`;
