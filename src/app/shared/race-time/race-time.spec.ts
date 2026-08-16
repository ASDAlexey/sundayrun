import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceTime } from './race-time';
import {
  RACE_TIME_IN_SENTENCE,
  RACE_TIME_OVER_AN_HOUR,
  RACE_TIME_PAIR,
  RACE_TIME_WITHOUT_FRACTION,
  RACE_TIME_WITH_FRACTION,
} from './race-time.mock';

@Component({
  selector: 'app-race-time-host',
  imports: [RaceTime],
  template: '<app-race-time [value]="value()" />',
})
class RaceTimeHost {
  readonly value = signal(RACE_TIME_WITH_FRACTION);
}

/** Every demoted run in order — the setting hides exactly these, so what lands in them is the test. */
function fractions(fixture: ComponentFixture<RaceTimeHost>): string[] {
  const spans: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.race-time__fraction');

  return [...spans].map((span) => span.textContent);
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
    expect(fractions(fixture), 'only the hundredths are demoted').toEqual([',18']);

    fixture.componentInstance.value.set(RACE_TIME_OVER_AN_HOUR);
    fixture.detectChanges();

    expect(wholeText(fixture)).toBe(RACE_TIME_OVER_AN_HOUR);
    expect(fractions(fixture), 'the colons of h:mm:ss are left alone').toEqual([',02']);

    fixture.componentInstance.value.set(RACE_TIME_WITHOUT_FRACTION);
    fixture.detectChanges();

    expect(wholeText(fixture), 'a cell that is not a time passes through').toBe(RACE_TIME_WITHOUT_FRACTION);
    expect(fractions(fixture), 'and gets no fraction of its own').toEqual([]);
  });

  it('picks the fractions out of a sentence and out of a pair of times', () => {
    fixture = TestBed.createComponent(RaceTimeHost);
    fixture.componentInstance.value.set(RACE_TIME_IN_SENTENCE);
    fixture.detectChanges();

    expect(wholeText(fixture), 'the words around the time survive, brackets included').toBe(RACE_TIME_IN_SENTENCE);
    expect(fractions(fixture)).toEqual([',00']);

    fixture.componentInstance.value.set(RACE_TIME_PAIR);
    fixture.detectChanges();

    expect(wholeText(fixture)).toBe(RACE_TIME_PAIR);
    expect(fractions(fixture), 'both times give up their fraction, not just the first').toEqual([',00', ',10']);
  });
});
