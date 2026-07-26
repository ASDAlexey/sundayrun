import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ROLL_INITIAL, ROLL_NEXT, ROLL_SHORTER } from './roll-number.mock';
import { RollNumber } from './roll-number';

@Component({
  selector: 'app-roll-host',
  imports: [RollNumber],
  template: '<app-roll-number [value]="value()" />',
})
class RollHost {
  readonly value = signal(ROLL_INITIAL);
}

/** The characters of each slot, live frame last — `[['2'], ['9', '8']]` while a digit flips. */
function slotChars(fixture: ComponentFixture<RollHost>): string[][] {
  return [...fixture.nativeElement.querySelectorAll('.roll__slot')].map((slot: Element) =>
    [...slot.querySelectorAll('.roll__frame')].map((frame) => frame.textContent ?? ''),
  );
}

describe('RollNumber', () => {
  let fixture: ComponentFixture<RollHost>;

  afterEach(() => fixture.destroy());

  it('flips only the digits that changed and drops the outgoing frame on the next change', () => {
    fixture = TestBed.createComponent(RollHost);
    fixture.detectChanges();

    expect(slotChars(fixture), 'the first render simply appears').toEqual([['2'], ['9']]);
    expect(fixture.nativeElement.querySelector('.roll__frame_enter'), 'nothing flies in on arrival').toBeNull();
    expect(fixture.nativeElement.querySelector('.visually-hidden').textContent).toBe(ROLL_INITIAL);

    fixture.componentInstance.value.set(ROLL_NEXT);
    fixture.detectChanges();

    expect(slotChars(fixture), 'the tens digit stays put while the units digit rolls').toEqual([['2'], ['9', '8']]);

    const frames = fixture.nativeElement.querySelectorAll('.roll__slot:last-child .roll__frame');

    expect(frames[0].classList.contains('roll__frame_out'), 'the replaced digit is on its way out').toBe(true);
    expect(frames[1].classList.contains('roll__frame_enter'), 'the arriving digit flies in').toBe(true);

    fixture.componentInstance.value.set(ROLL_SHORTER);
    fixture.detectChanges();

    expect(slotChars(fixture), 'a shorter number keeps one slot, and it starts over cleanly').toEqual([['2', '7']]);
    expect(fixture.nativeElement.querySelector('.visually-hidden').textContent).toBe(ROLL_SHORTER);
  });
});
