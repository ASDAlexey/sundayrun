import { RECORDS_PAGE_LINK, RECORDS_VIEW_QUERY_PARAM } from '../records/records-page.constant';
import { RecordsView } from '../records/records-page.enum';

/** One card per explained feature: короли, первый круг, гонка за сезон, легенда, серии, раж, бейджи, итоги, дуэли, соперники, мем-пороги, график. */
export const EXPECTED_GUIDE_CARD_COUNT = 12;

/** The season-race card deep-links straight into the chart view of the records page. */
export const EXPECTED_CHART_LINK_HREF = `${RECORDS_PAGE_LINK}?${RECORDS_VIEW_QUERY_PARAM}=${RecordsView.chart}`;
