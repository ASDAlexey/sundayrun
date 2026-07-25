import { Component, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TIMER_PAGE_LINK } from '../../app.constant';
import { OfflineNotice } from './offline-notice';
import { OFFLINE_EVENT, ONLINE_EVENT } from './offline-notice.constant';
import { OfflineStatusService } from './offline-status.service';

@Component({
  selector: 'app-offline-host',
  imports: [OfflineNotice],
  template: `<app-offline-notice><p class="host-error">Не удалось загрузить список забегов.</p></app-offline-notice>`,
})
class OfflineHost {}

describe('OfflineNotice', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('projects the page error while online and takes over the moment the network drops', async () => {
    const fixture = TestBed.createComponent(OfflineHost);
    const view = TestBed.inject(DOCUMENT).defaultView;
    const element: HTMLElement = fixture.nativeElement;

    await fixture.whenStable();

    expect(element.querySelector('.host-error'), 'with a network the page keeps its own error text').not.toBeNull();
    expect(element.querySelector('.offline-notice')).toBeNull();

    view?.dispatchEvent(new Event(OFFLINE_EVENT));
    fixture.detectChanges();

    expect(element.querySelector('.offline-notice__text'), 'no network — one sentence instead of a failure').not.toBeNull();
    expect(element.querySelector('.offline-notice__action')?.getAttribute('href'), 'the stopwatch is one tap away').toBe(TIMER_PAGE_LINK);
    expect(element.querySelector('.host-error'), 'the technical error gives way').toBeNull();

    view?.dispatchEvent(new Event(ONLINE_EVENT));
    fixture.detectChanges();

    expect(element.querySelector('.host-error'), 'the network is back and so is the real error').not.toBeNull();
    expect(element.querySelector('.offline-notice')).toBeNull();
  });
});

describe('OfflineStatusService without a window', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }] });
  });

  it('reports «online» during prerender instead of listening to a window it does not have', () => {
    expect(TestBed.inject(OfflineStatusService).offline()).toBe(false);
  });
});
