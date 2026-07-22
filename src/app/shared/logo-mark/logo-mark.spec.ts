import { TestBed } from '@angular/core/testing';

import { LogoMark } from './logo-mark';

describe('LogoMark', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LogoMark] });
  });

  it('renders the two laps and the start dot', () => {
    const fixture = TestBed.createComponent(LogoMark);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('.logo-mark__lap').length).toBe(2);
    expect(element.querySelector('.logo-mark__start')).not.toBeNull();
  });
});
