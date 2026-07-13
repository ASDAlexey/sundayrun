/** One published race inside the «Загруженные забеги» list on /admin. */
export interface AdminRaceItem {
  slug: string;
  number: number;
  dateLong: string;
  participantCount: number;
  /** routerLink to the public race page — the «протокол» link. */
  raceLink: string;
  /** Lowercased number + dates haystack for the «номер или дата» search. */
  searchText: string;
  /** Localized aria-label of the trash button (attribute i18n drops interpolations). */
  deleteLabel: string;
  /** A just-published event the archive is still building — rendered as a «публикуется…» row, no actions. */
  pending?: boolean;
}
