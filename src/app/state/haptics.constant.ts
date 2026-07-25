import { TimerFeedbackType } from './haptics.enum';
import { TimerClickVoice } from './haptics.interface';
import { TimerStorage } from './timer-storage.type';

/**
 * Vibration patterns for `navigator.vibrate`, in milliseconds: odd positions buzz, even positions
 * pause. Android and Chrome only — iOS has never implemented the API (docs/TIMER.md §10).
 */
export const TIMER_VIBRATION: Record<TimerFeedbackType, readonly number[]> = {
  /** Undo — one longer, duller buzz: «убрал». */
  cancel: [25],
  /** A refused action — twice, sharply: «так нельзя». */
  error: [15, 60, 15],
  /** A runner is home — a double tick. */
  finish: [10, 40, 10],
  /** The lap is recorded — the shortest possible «принял». */
  lap: [10],
  /** The mass start — one long «пуск», the moment the clock takes off. */
  start: [60],
};

/**
 * The WebAudio click — the iPhone stand-in for a buzz it will never feel. A bare oscillator with no
 * files behind it: up to the peak in `attackMs`, then an exponential decay to silence over
 * `releaseMs`. Eight milliseconds in total, which is a dry click rather than a beep.
 */
export const TIMER_CLICK = {
  attackMs: 1,
  peakGain: 0.14,
  releaseMs: 7,
  wave: 'triangle',
} as const;

/** Silence at the start of the envelope. */
export const TIMER_CLICK_SILENCE = 0;

/** An exponential ramp can never reach zero, so «тишина» is this close to it. */
export const TIMER_CLICK_FLOOR = 0.0001;

/**
 * The voices of the vocabulary: pitch in hertz and the offset from the gesture in milliseconds. The
 * finish sits higher and speaks twice, exactly like the vibration does on Android.
 */
export const TIMER_CLICK_VOICES: Record<TimerFeedbackType, readonly TimerClickVoice[]> = {
  cancel: [{ atMs: 0, hz: 620 }],
  error: [
    { atMs: 0, hz: 300 },
    { atMs: 60, hz: 300 },
  ],
  finish: [
    { atMs: 0, hz: 1800 },
    { atMs: 40, hz: 2400 },
  ],
  lap: [{ atMs: 0, hz: 1200 }],
  start: [{ atMs: 0, hz: 480 }],
};

/** The method every Android browser has and no iOS one does; checked by feature, never by user agent. */
export const VIBRATE_METHOD = 'vibrate';

/** Where the choice of the «⋮» toggle survives a reload. */
export const TIMER_SOUND_STORAGE_KEY = 'sundayrun.timer.sound.v1';

/** The click is off until somebody asks for it: in a park it is not what everybody wants. */
export const TIMER_SOUND_ON = 'on';
export const TIMER_SOUND_OFF = 'off';

/** Prerender has no storage and no speaker; the click is simply never armed there. */
export const TIMER_SOUND_SSR_NOOP_STORAGE: TimerStorage = {
  getItem: () => null,
  setItem: () => undefined,
};
