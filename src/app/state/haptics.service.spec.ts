import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mock } from 'vitest';

import { TIMER_CLICK_VOICES, TIMER_SOUND_OFF, TIMER_SOUND_ON, TIMER_SOUND_STORAGE_KEY, TIMER_VIBRATION } from './haptics.constant';
import { TimerFeedback } from './haptics.enum';
import { HapticsService } from './haptics.service';
import { AudioContextMock, audioContextMock, soundStorageMock } from './haptics.service.mock';

describe('HapticsService', () => {
  let context: AudioContextMock;
  let storage: { getItem: Mock; setItem: Mock; removeItem: Mock };
  let doc: { defaultView: { AudioContext?: Mock; navigator: { vibrate?: Mock } } | null };

  const vibrate = vi.fn();
  const constructAudio = vi.fn();

  beforeEach(() => {
    context = audioContextMock();
    storage = soundStorageMock(null);
    vibrate.mockClear();
    constructAudio.mockReset();
    constructAudio.mockImplementation(function audio() {
      return context;
    });
    doc = { defaultView: { AudioContext: constructAudio, navigator: { vibrate } } };
    vi.stubGlobal('localStorage', storage);
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: doc }] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('buzzes every entry of the vocabulary and stays silent until the click is armed', () => {
    const service = TestBed.inject(HapticsService);

    expect(service.soundEnabled(), 'a park does not need a clicking phone by default').toBe(false);

    service.play(TimerFeedback.finish);

    expect(vibrate).toHaveBeenCalledExactlyOnceWith([...TIMER_VIBRATION.finish]);
    expect(context.createOscillator, 'the speaker stays out of it while the toggle is off').not.toHaveBeenCalled();

    service.toggleSound();

    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(TIMER_SOUND_STORAGE_KEY, TIMER_SOUND_ON);
    expect(service.soundEnabled()).toBe(true);
    expect(constructAudio, 'the context is born inside the gesture that armed it').toHaveBeenCalledOnce();
    expect(context.oscillators.length, 'arming the click previews it').toBe(TIMER_CLICK_VOICES.lap.length);

    service.play(TimerFeedback.start);

    expect(constructAudio, 'and is reused for the rest of the measurement').toHaveBeenCalledOnce();
    expect(context.oscillators.length).toBe(TIMER_CLICK_VOICES.lap.length + TIMER_CLICK_VOICES.start.length);
    expect(context.oscillators[1].stop).toHaveBeenCalledOnce();

    service.toggleSound();

    expect(storage.setItem).toHaveBeenLastCalledWith(TIMER_SOUND_STORAGE_KEY, TIMER_SOUND_OFF);
    expect(service.soundEnabled()).toBe(false);
  });

  it('remembers an armed click across a reload and survives a browser with no speaker in it', () => {
    storage.getItem.mockReturnValue(TIMER_SOUND_ON);
    delete doc.defaultView?.AudioContext;

    const service = TestBed.inject(HapticsService);

    expect(service.soundEnabled()).toBe(true);

    service.play(TimerFeedback.lap);

    expect(vibrate, 'an old WebView still buzzes, it just cannot click').toHaveBeenCalledOnce();
  });

  it('says nothing on an iPhone, which has no vibration to give', () => {
    delete doc.defaultView?.navigator.vibrate;

    const service = TestBed.inject(HapticsService);

    service.play(TimerFeedback.cancel);

    expect(vibrate, 'iOS has never implemented the API, and a user agent is never asked about it').not.toHaveBeenCalled();
  });
});

describe('HapticsService during a prerender', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', undefined);
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('flips the toggle without a window, a storage or a speaker to answer it', () => {
    const service = TestBed.inject(HapticsService);

    service.play(TimerFeedback.error);

    expect(service.soundEnabled()).toBe(false);

    service.toggleSound();

    expect(service.soundEnabled(), 'the toggle still flips, it just has nowhere to be heard').toBe(true);
  });
});
