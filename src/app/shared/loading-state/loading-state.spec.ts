import { TestBed } from '@angular/core/testing';

import { LoadingState } from './loading-state';
import { LOADING_LABEL_MOCK } from './loading-state.mock';

describe('LoadingState', () => {
  it('captions the sweep with what the page is loading and keeps the lane out of the status announcement', async () => {
    const fixture = TestBed.createComponent(LoadingState);
    const element: HTMLElement = fixture.nativeElement;

    fixture.componentRef.setInput('label', LOADING_LABEL_MOCK);

    await fixture.whenStable();

    expect(element.querySelector('.loading-state__label')?.textContent).toBe(LOADING_LABEL_MOCK);
    expect(element.querySelector('.loading-state__lane')?.getAttribute('aria-hidden'), 'the lane is decoration').toBe('true');
  });
});
