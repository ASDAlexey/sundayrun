import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceTime } from './race-time';
import { RACE_TIME_OVER_AN_HOUR, RACE_TIME_WITHOUT_FRACTION, RACE_TIME_WITH_FRACTION } from './race-time.mock';

@Component({
  selector: 'app-race-time-host',
  imports: [RaceTime],
  template: '<app-race-time [value]="value()" />',
})
class RaceTimeHost {
  readonly value = signal(RACE_TIME_WITH_FRACTION);
}

function fractionText(fixture: ComponentFixture<RaceTimeHost>): string {
  return fixture.nativeElement.querySelector('.race-time__fraction').textContent;
}

function wholeText(fixture: ComponentFixture<RaceTimeHost>): string {
  return fixture.nativeElement.querySelector('.race-time').textContent;
}

describe('RaceTime', () => {
  let fixture: ComponentFixture<RaceTimeHost>;

  afterEach(() => fixture.destroy());

  it('demotes the hundredths, splits an hour-long time at its fraction and leaves a non-time whole', () => {
    fixture = TestBed.createComponent(RaceTimeHost);
    fixture.detectChanges();

    expect(wholeText(fixture), 'the rendered text still reads as the value it was given').toBe(RACE_TIME_WITH_FRACTION);
    expect(fractionText(fixture), 'only the hundredths are demoted').toBe(',18');

    fixture.componentInstance.value.set(RACE_TIME_OVER_AN_HOUR);
    fixture.detectChanges();

    expect(wholeText(fixture)).toBe(RACE_TIME_OVER_AN_HOUR);
    expect(fractionText(fixture), 'the colons of h:mm:ss are left alone').toBe(',02');

    fixture.componentInstance.value.set(RACE_TIME_WITHOUT_FRACTION);
    fixture.detectChanges();

    expect(wholeText(fixture), 'a cell that is not a time passes through').toBe(RACE_TIME_WITHOUT_FRACTION);
    expect(fractionText(fixture), 'and gets no fraction of its own').toBe('');
  });
});
