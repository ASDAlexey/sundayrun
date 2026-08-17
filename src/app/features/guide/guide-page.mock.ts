import { RECORDS_PAGE_LINK, RECORDS_VIEW_QUERY_PARAM } from '../records/records-page.constant';
import { RecordsView } from '../records/records-page.enum';

/** One card per explained feature: короли, первый круг, раскладка, обгоны второго круга, кто чаще всех, гонка за сезон, рейтинг, до следующего места, легенда, серии, раж, бейджи, итоги, прогресс года, дуэли, соперники, мем-пороги, форма, цифры, погода, фото, график, секундомер, свой трек, сотые. */
export const EXPECTED_GUIDE_CARD_COUNT = 26;

/** The season-race card deep-links straight into the chart view of the records page. */
export const EXPECTED_CHART_LINK_HREF = `${RECORDS_PAGE_LINK}?${RECORDS_VIEW_QUERY_PARAM}=${RecordsView.chart}`;

/** The «Кто чаще всех» card deep-links straight into the loyalty board. */
export const EXPECTED_ATTENDANCE_LINK_HREF = `${RECORDS_PAGE_LINK}?${RECORDS_VIEW_QUERY_PARAM}=${RecordsView.attendance}`;

/** The rating card deep-links straight into the combined М+Ж board. */
export const EXPECTED_RATING_LINK_HREF = `${RECORDS_PAGE_LINK}?${RECORDS_VIEW_QUERY_PARAM}=${RecordsView.rating}`;
