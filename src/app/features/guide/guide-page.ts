import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LEGEND_WINDOW_DAYS } from '../../core/history/legend.constant';
import { VERSUS_PAGE_LINK } from '../../app.constant';
import { RECORDS_PAGE_LINK } from '../records/records-page.constant';
import { YEAR_PAGE_BASE_LINK } from '../year/year-page.constant';

/** The tour of the site's game layer: what every title, streak and badge means and where it lives. */
@Component({
  selector: 'app-guide-page',
  imports: [RouterLink],
  templateUrl: './guide-page.html',
  styleUrl: './guide-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidePage {
  protected readonly recordsLink = RECORDS_PAGE_LINK;
  protected readonly yearLink = YEAR_PAGE_BASE_LINK;
  protected readonly versusLink = VERSUS_PAGE_LINK;
  protected readonly legendWindowDays = LEGEND_WINDOW_DAYS;
}
