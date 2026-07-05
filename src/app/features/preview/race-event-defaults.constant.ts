import { RaceEvent } from '../../core/models/race-event.interface';

/** Fixed protocol requisites taken from the sample protocol (assets/20.09.2020.pdf). */
export const RACE_EVENT_DEFAULTS: Pick<RaceEvent, 'chairman' | 'city' | 'clubName' | 'park'> = {
  city: 'г. Таганрог',
  park: 'ПКиО им. Горького',
  clubName: 'КЛБ «Легенда»',
  chairman: 'В.С. Хахуцкий',
};
