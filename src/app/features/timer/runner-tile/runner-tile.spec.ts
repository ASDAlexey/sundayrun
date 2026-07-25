import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TimerRunnerStage } from '../../../core/timer/timer-session.enum';
import { TimerTile } from './runner-tile';
import {
  TILE_ACCENT_INDEX,
  TILE_DOWN,
  TILE_DOWN_LATE,
  TILE_DOWN_REPEAT,
  TILE_GIVEN,
  TILE_INK_CLASS,
  TILE_RUNNER,
  TILE_SURNAME,
  TILE_TAP_CENTRE,
  TILE_TAP_X,
  TILE_TAP_Y,
  TILE_TIME_TEXT,
  TILE_UP_DIAGONAL,
  TILE_UP_LONG,
  TILE_UP_SWIPE_LEFT,
  TILE_UP_SWIPE_RIGHT,
  TILE_UP_TAP,
  tilePointerEvent,
} from './runner-tile.mock';

describe('TimerTile', () => {
  let fixture: ComponentFixture<TimerTile>;
  let button: HTMLElement;
  const taps = vi.fn();
  const undos = vi.fn();
  const retires = vi.fn();
  const details = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(TimerTile);
    fixture.componentRef.setInput('runner', TILE_RUNNER);
    fixture.componentRef.setInput('stage', TimerRunnerStage.waitingLap);
    fixture.componentRef.setInput('surname', TILE_SURNAME);
    fixture.componentRef.setInput('givenName', TILE_GIVEN);
    fixture.componentRef.setInput('timeText', TILE_TIME_TEXT);
    fixture.componentRef.setInput('accentIndex', TILE_ACCENT_INDEX);
    fixture.componentInstance.tap.subscribe(taps);
    fixture.componentInstance.undo.subscribe(undos);
    fixture.componentInstance.retire.subscribe(retires);
    fixture.componentInstance.details.subscribe(details);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('.timer-tile');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('draws the name, the time and the personal ink, and labels itself with the whole name', async () => {
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-tile__surname')?.textContent?.trim()).toBe(TILE_SURNAME);
    expect(element.querySelector('.timer-tile__given')?.textContent?.trim()).toBe(TILE_GIVEN);
    expect(element.querySelector('.timer-tile__time')?.textContent?.trim()).toBe(TILE_TIME_TEXT);
    expect(button.classList.contains(TILE_INK_CLASS)).toBe(true);
    expect(button.getAttribute('aria-label'), 'the label spells out what the tile had to shorten').toBe(TILE_RUNNER.fullName);
    expect(button.style.getPropertyValue('--timer-tile-tap-x')).toBe(TILE_TAP_CENTRE);
  });

  it('cuts on pointerdown, ripples from under the finger and swallows a stutter inside the guard', async () => {
    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    await fixture.whenStable();

    expect(taps).toHaveBeenCalledOnce();
    expect(button.style.getPropertyValue('--timer-tile-tap-x')).toBe(TILE_TAP_X);
    expect(button.style.getPropertyValue('--timer-tile-tap-y')).toBe(TILE_TAP_Y);

    const ripple = fixture.nativeElement.querySelector('.timer-tile__ripple');

    expect(ripple).not.toBeNull();

    ripple.dispatchEvent(new Event('animationend'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.timer-tile__ripple'), 'the wave lives one animation and goes').toBeNull();

    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_TAP));
    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_REPEAT));

    expect(taps, 'a repeat inside 400 ms is a stutter of the finger').toHaveBeenCalledOnce();

    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));

    expect(taps).toHaveBeenCalledTimes(2);
    expect(undos).not.toHaveBeenCalled();
    expect(retires).not.toHaveBeenCalled();
    expect(details).not.toHaveBeenCalled();
  });

  it('rolls its own cut back on a swipe right and retires the runner on a swipe left', () => {
    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_SWIPE_RIGHT));

    expect(undos).toHaveBeenCalledOnce();
    expect(retires, 'rightwards only takes the time back').not.toHaveBeenCalled();

    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));
    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_SWIPE_LEFT));

    expect(undos).toHaveBeenCalledTimes(2);
    expect(retires).toHaveBeenCalledOnce();
  });

  it('opens the card on a long press, and does nothing for a scroll, a stray release or a cancel', () => {
    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_LONG));

    expect(details).toHaveBeenCalledOnce();

    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN_LATE));
    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_DIAGONAL));

    expect(details, 'a hundred pixels down is a scroll').toHaveBeenCalledOnce();
    expect(undos).not.toHaveBeenCalled();

    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_LONG));
    button.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    button.dispatchEvent(tilePointerEvent('pointercancel', TILE_DOWN));
    button.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_LONG));

    expect(details, 'a release with no press behind it decides nothing').toHaveBeenCalledOnce();
  });

  it('cuts from the keyboard with the wave centred, greys out a finished runner and blocks the platform menu', async () => {
    const menu = tilePointerEvent('contextmenu', TILE_DOWN);
    const prevented = vi.spyOn(menu, 'preventDefault');

    button.dispatchEvent(menu);
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    await fixture.whenStable();

    expect(prevented).toHaveBeenCalledOnce();
    expect(taps).toHaveBeenCalledOnce();
    expect(button.style.getPropertyValue('--timer-tile-tap-x')).toBe(TILE_TAP_CENTRE);
    expect(fixture.nativeElement.querySelector('.timer-tile__ripple')).not.toBeNull();

    fixture.componentRef.setInput('stage', TimerRunnerStage.finished);
    fixture.componentRef.setInput('timeText', '');
    await fixture.whenStable();

    expect(button.classList.contains('timer-tile_done')).toBe(true);
    expect(fixture.nativeElement.querySelector('.timer-tile__time'), 'no time, no node').toBeNull();
  });
});
