import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeltaBase } from '../../state/delta-base.enum';
import { DeltaBaseService } from '../../state/delta-base.service';
import { HundredthsService } from '../../state/hundredths.service';
import { Settings } from './settings';
import { SETTINGS_SAMPLE_TIME } from './settings.constant';
import {
  DeltaBaseServiceMock,
  EXPECTED_CHOICE_LABELS,
  HundredthsServiceMock,
  SETTINGS_ACTIVE_CHOICE_SELECTOR,
  SETTINGS_CHOICE_SELECTOR,
  SETTINGS_SWITCH_SELECTOR,
  deltaBaseServiceMock,
  hundredthsServiceMock,
} from './settings.mock';

describe('Settings', () => {
  let hundredths: HundredthsServiceMock;
  let deltaBase: DeltaBaseServiceMock;
  let fixture: ComponentFixture<Settings>;

  function query(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  function queryAll(selector: string): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll(selector)];
  }

  function card(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('.settings__card');
  }

  beforeEach(() => {
    hundredths = hundredthsServiceMock();
    deltaBase = deltaBaseServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: HundredthsService, useValue: hundredths },
        { provide: DeltaBaseService, useValue: deltaBase },
      ],
    });
    fixture = TestBed.createComponent(Settings);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('raises the card on the gear, hands every flip to the service and closes on «×»', async () => {
    fixture.detectChanges();

    expect(card().open, 'the card stays down until asked for').toBe(false);

    query('.settings__gear')?.click();
    await fixture.whenStable();

    expect(card().open).toBe(true);
    expect(fixture.componentInstance.open(), 'the gear stays lit while the card is up').toBe(true);
    expect(query(SETTINGS_SWITCH_SELECTOR)?.getAttribute('aria-checked'), 'the switch reads the state, not the other way round').toBe(
      'true',
    );
    expect(query('.settings__sample')?.textContent, 'the sample is a real time, so the effect is visible here').toBe(SETTINGS_SAMPLE_TIME);

    query(SETTINGS_SWITCH_SELECTOR)?.click();

    expect(hundredths.toggle).toHaveBeenCalledOnce();

    hundredths.shown.set(false);
    await fixture.whenStable();

    expect(query(SETTINGS_SWITCH_SELECTOR)?.getAttribute('aria-checked')).toBe('false');

    query('.settings__close')?.click();

    expect(card().open).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('offers the four delta bases, marks the one in force and hands a pick to the service', async () => {
    fixture.detectChanges();

    const choices = queryAll(SETTINGS_CHOICE_SELECTOR);

    expect(choices.map((choice) => choice.textContent?.trim())).toEqual(EXPECTED_CHOICE_LABELS);
    expect(query(SETTINGS_ACTIVE_CHOICE_SELECTOR)?.textContent?.trim(), 'the default is lit without anyone picking it').toBe(
      EXPECTED_CHOICE_LABELS[0],
    );

    choices[3].click();

    expect(deltaBase.select, 'the card reports the pick; the service owns the state').toHaveBeenCalledWith(DeltaBase.off);

    deltaBase.base.set(DeltaBase.off);
    await fixture.whenStable();

    expect(query(SETTINGS_ACTIVE_CHOICE_SELECTOR)?.textContent?.trim()).toBe(EXPECTED_CHOICE_LABELS[3]);
  });

  it('closes on Escape and on the scrim, and stays up when the click lands inside the card', async () => {
    fixture.detectChanges();
    query('.settings__gear')?.click();
    await fixture.whenStable();

    card().dispatchEvent(new Event('cancel'));

    expect(card().open, 'Escape reaches a native dialog as «cancel»').toBe(false);

    query('.settings__gear')?.click();
    await fixture.whenStable();
    query('.settings__item')?.click();

    expect(card().open, 'a click on the row inside is not a click on the scrim').toBe(true);

    card().click();

    expect(card().open, 'the platform reports a scrim click as a click on the dialog itself').toBe(false);
  });
});
