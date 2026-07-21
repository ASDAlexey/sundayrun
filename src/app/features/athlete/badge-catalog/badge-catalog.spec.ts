import { ComponentFixture, TestBed } from '@angular/core/testing';

import { polyfillDialogModal } from '../../spec-utils/dialog-polyfill';
import { CATALOG_ACTIVITY, CATALOG_RARITY, CATALOG_YEAR, CATALOG_YEAR_BADGES, EXPECTED_CATALOG_ROWS } from './badge-catalog.mock';
import { BadgeCatalog } from './badge-catalog';

polyfillDialogModal();

describe('BadgeCatalog', () => {
  let fixture: ComponentFixture<BadgeCatalog>;
  let dialog: HTMLDialogElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(BadgeCatalog);
    fixture.componentRef.setInput('yearBadges', CATALOG_YEAR_BADGES);
    fixture.componentRef.setInput('rarity', CATALOG_RARITY);
    fixture.componentRef.setInput('year', CATALOG_YEAR);
    fixture.componentRef.setInput('activity', CATALOG_ACTIVITY);
    fixture.detectChanges();
    dialog = fixture.nativeElement.querySelector('dialog');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('opens as a modal with every badge row, dims the locked ones and closes from the button and the backdrop', () => {
    fixture.componentInstance.open();

    expect(dialog.open, 'showModal opens the dialog').toBe(true);

    const rows = [...dialog.querySelectorAll<HTMLElement>('.badge-catalog__row')];

    expect(rows.length, 'one row per possible badge').toBe(EXPECTED_CATALOG_ROWS.length);
    expect(rows.filter((row) => row.className.includes('badge-catalog__row_locked')).length, 'unearned rows dim').toBe(18);
    expect(dialog.querySelectorAll('.badge-catalog__status_earned').length, 'earned rows show their years').toBe(2);
    expect(dialog.querySelectorAll('.badge-catalog__bar-fill').length, 'in-progress rows draw the bar').toBe(4);

    dialog.querySelector<HTMLButtonElement>('.badge-catalog__close')?.click();

    expect(dialog.open, 'the close button closes').toBe(false);

    fixture.componentInstance.open();
    dialog.querySelector<HTMLElement>('.badge-catalog__content')?.click();

    expect(dialog.open, 'a click inside stays open').toBe(true);

    dialog.click();

    expect(dialog.open, 'a backdrop click closes').toBe(false);
  });
});
