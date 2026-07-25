import { DOCUMENT, Service, inject, signal } from '@angular/core';

import { MS_IN_SECOND } from '../core/time/duration.constant';
import {
  TIMER_CLICK,
  TIMER_CLICK_FLOOR,
  TIMER_CLICK_SILENCE,
  TIMER_CLICK_VOICES,
  TIMER_SOUND_OFF,
  TIMER_SOUND_ON,
  TIMER_SOUND_SSR_NOOP_STORAGE,
  TIMER_SOUND_STORAGE_KEY,
  TIMER_VIBRATION,
  VIBRATE_METHOD,
} from './haptics.constant';
import { TimerFeedback, TimerFeedbackType } from './haptics.enum';
import { TimerClickVoice } from './haptics.interface';
import { TimerStorage } from './timer-storage.type';

/**
 * What the instrument answers a finger with (docs/TIMER.md §10). Android gets the whole vibration
 * vocabulary — a lap, a finish, an undo and a refusal all feel different, so the organiser knows
 * what happened without looking down at the pack.
 *
 * iOS has no `navigator.vibrate` and has never had one, so the same vocabulary is spoken as sound:
 * an eight-millisecond oscillator click, generated on the spot, no files and no libraries. It is off
 * by default — not everybody wants a clicking phone in a park — and the «⋮» toggle remembers the
 * answer. The `AudioContext` is built on that toggle and nowhere else: a browser only allows one
 * inside a user gesture, and building it eagerly would leave a dead, suspended context behind.
 *
 * Everything here is best-effort by design. A platform without vibration, without WebAudio, or a
 * prerender without a window at all, simply gets a quieter instrument — never an error.
 */
@Service()
export class HapticsService {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #sound = signal(this.#storage.getItem(TIMER_SOUND_STORAGE_KEY) === TIMER_SOUND_ON);

  /** Whether the click is armed; the «⋮» menu renders this as a pressed toggle. */
  readonly soundEnabled = this.#sound.asReadonly();

  #audio: AudioContext | null = null;

  /**
   * Called straight from the tap on the menu item, which is what makes it legal to open an
   * `AudioContext` here. Turning the click on plays one immediately: it doubles as the preview and
   * as the gesture that unlocks the context for the rest of the race.
   */
  toggleSound(): void {
    const enabled = !this.#sound();

    this.#sound.set(enabled);
    this.#storage.setItem(TIMER_SOUND_STORAGE_KEY, enabled ? TIMER_SOUND_ON : TIMER_SOUND_OFF);

    if (enabled) {
      this.play(TimerFeedback.lap);
    }
  }

  /** One entry of the vocabulary: buzzed where a phone can buzz, clicked where it cannot. */
  play(kind: TimerFeedbackType): void {
    this.#vibrate(TIMER_VIBRATION[kind]);
    this.#click(TIMER_CLICK_VOICES[kind]);
  }

  #vibrate(pattern: readonly number[]): void {
    const view = this.#view;

    if (view === null || !(VIBRATE_METHOD in view.navigator)) {
      return;
    }

    // `navigator.vibrate` demands a mutable array, and the vocabulary is frozen by `as const`.
    view.navigator.vibrate([...pattern]);
  }

  #click(voices: readonly TimerClickVoice[]): void {
    if (!this.#sound()) {
      return;
    }

    const context = this.#context();

    if (context === null) {
      return;
    }

    for (const voice of voices) {
      this.#beep(context, voice);
    }
  }

  /**
   * The envelope of one click: silence, a ramp to the peak in a millisecond, then an exponential
   * decay to (almost) nothing. Both nodes are disposable — an oscillator cannot be started twice.
   */
  #beep(context: AudioContext, voice: TimerClickVoice): void {
    const startedAt = context.currentTime + voice.atMs / MS_IN_SECOND;
    const peakAt = startedAt + TIMER_CLICK.attackMs / MS_IN_SECOND;
    const endedAt = peakAt + TIMER_CLICK.releaseMs / MS_IN_SECOND;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = TIMER_CLICK.wave;
    oscillator.frequency.setValueAtTime(voice.hz, startedAt);
    envelope.gain.setValueAtTime(TIMER_CLICK_SILENCE, startedAt);
    envelope.gain.linearRampToValueAtTime(TIMER_CLICK.peakGain, peakAt);
    envelope.gain.exponentialRampToValueAtTime(TIMER_CLICK_FLOOR, endedAt);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startedAt);
    oscillator.stop(endedAt);
  }

  /** Built once, on the gesture that armed the sound, and kept for the rest of the measurement. */
  #context(): AudioContext | null {
    const existing = this.#audio;

    if (existing !== null) {
      return existing;
    }

    const Constructor = this.#view?.AudioContext;

    if (Constructor === undefined) {
      return null;
    }

    this.#audio = new Constructor();

    return this.#audio;
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): TimerStorage {
    return typeof localStorage === 'undefined' ? TIMER_SOUND_SSR_NOOP_STORAGE : localStorage;
  }
}
