import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RACES_LIST_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { RECORDS_PAGE_LINK } from '../records/records-page.constant';
import { YEAR_PAGE_BASE_LINK } from '../year/year-page.constant';
import { GuidePage } from './guide-page';
import { EXPECTED_CHART_LINK_HREF, EXPECTED_GUIDE_CARD_COUNT, EXPECTED_RATING_LINK_HREF } from './guide-page.mock';

describe('GuidePage', () => {
  let fixture: ComponentFixture<GuidePage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders a card per feature and links into the records, year and versus pages', async () => {
    fixture = TestBed.createComponent(GuidePage);

    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const cards = [...element.querySelectorAll('.guide__card')];
    const links = [...element.querySelectorAll('.guide__card-link')];

    expect(element.querySelector('.guide__title')?.textContent?.trim()).not.toBe('');
    expect(cards.length).toBe(EXPECTED_GUIDE_CARD_COUNT);
    expect(
      links.map((link) => link.getAttribute('href')),
      'the records-anchored titles route through the records page, the rest link home pages',
    ).toEqual([
      RECORDS_PAGE_LINK,
      RECORDS_PAGE_LINK,
      EXPECTED_CHART_LINK_HREF,
      EXPECTED_RATING_LINK_HREF,
      RACES_LIST_PAGE_LINK,
      RECORDS_PAGE_LINK,
      YEAR_PAGE_BASE_LINK,
      YEAR_PAGE_BASE_LINK,
      VERSUS_PAGE_LINK,
    ]);
  });
});
