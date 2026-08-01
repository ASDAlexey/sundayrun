import { TimerSession } from './timer-session.interface';

/** What the shareable message is built from: the measurement, and the page it lives on if it has one. */
export interface SessionShareTextInput {
  session: TimerSession;
  /** The published protocol's url, or null while the measurement is only on this phone. */
  url: string | null;
}

/** The words of the message, handed in by the caller so the core stays free of `$localize`. */
export interface SessionShareTextLabels {
  /** «Воскресный пробег · 31 июля 2026» — the first line. */
  title: string;
  fiveKm: string;
  twoThreeKm: string;
  didNotFinish: string;
}
