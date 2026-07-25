import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

/** The stand-in every timer component gets: one flag the spec drives, two spies it asserts on. */
export interface HapticsServiceMock {
  soundEnabled: WritableSignal<boolean>;
  toggleSound: Mock;
  play: Mock;
}

export function hapticsServiceMock(): HapticsServiceMock {
  return { soundEnabled: signal(false), toggleSound: vi.fn(), play: vi.fn() };
}

/** The three scheduling calls of one gain or frequency curve. */
export interface AudioParamMock {
  setValueAtTime: Mock;
  linearRampToValueAtTime: Mock;
  exponentialRampToValueAtTime: Mock;
}

export interface OscillatorMock {
  type: string;
  frequency: AudioParamMock;
  connect: Mock;
  start: Mock;
  stop: Mock;
}

export interface AudioContextMock {
  currentTime: number;
  destination: object;
  createGain: Mock;
  createOscillator: Mock;
  oscillators: OscillatorMock[];
}

/** The clock the fake context reports, so a spec can read the scheduled offsets straight off it. */
export const AUDIO_CONTEXT_TIME = 10;

function audioParamMock(): AudioParamMock {
  return { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}

/** A WebAudio graph that records what was asked of it and makes no sound at all. */
export function audioContextMock(): AudioContextMock {
  const oscillators: OscillatorMock[] = [];

  return {
    currentTime: AUDIO_CONTEXT_TIME,
    destination: {},
    oscillators,
    createGain: vi.fn(() => ({ gain: audioParamMock(), connect: vi.fn() })),
    createOscillator: vi.fn(() => {
      const oscillator = { type: '', frequency: audioParamMock(), connect: vi.fn(), start: vi.fn(), stop: vi.fn() };

      oscillators.push(oscillator);

      return oscillator;
    }),
  };
}

/** The localStorage stub of the sound toggle: a spec reads `setItem` and rewrites `getItem`. */
export function soundStorageMock(stored: string | null): { getItem: Mock; setItem: Mock; removeItem: Mock } {
  return { getItem: vi.fn(() => stored), setItem: vi.fn(), removeItem: vi.fn() };
}
