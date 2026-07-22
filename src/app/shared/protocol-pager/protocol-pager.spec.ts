import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { SourceFile } from '../../state/source-file.interface';
import { ProtocolPager } from './protocol-pager';
import { EMPTY_FILE_NAME } from './protocol-pager.constant';
import {
  BATCH_DRAFT_COUNT,
  EXPECTED_ACTIVE_DOTS,
  EXPECTED_ARIA_CURRENT,
  FIRST_DRAFT_INDEX,
  LAST_DRAFT_INDEX,
  MIDDLE_DRAFT_INDEX,
  PAGER_READINESS,
  PAGER_SOURCE_FILE,
  SINGLE_DRAFT_COUNT,
} from './protocol-pager.mock';

describe('ProtocolPager', () => {
  const draftCount = signal(SINGLE_DRAFT_COUNT);
  const activeIndex = signal(FIRST_DRAFT_INDEX);
  const draftsReady = signal<boolean[]>([]);
  const sourceFile = signal<SourceFile | null>(null);
  const selectDraft = vi.fn();

  let fixture: ComponentFixture<ProtocolPager>;

  beforeEach(() => {
    vi.clearAllMocks();
    draftCount.set(SINGLE_DRAFT_COUNT);
    activeIndex.set(FIRST_DRAFT_INDEX);
    draftsReady.set([]);
    sourceFile.set(null);
    TestBed.configureTestingModule({
      providers: [{ provide: ProtocolStateService, useValue: { draftCount, activeIndex, draftsReady, sourceFile, selectDraft } }],
    });
    fixture = TestBed.createComponent(ProtocolPager);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders nothing for a single draft', () => {
    expect(fixture.nativeElement.querySelector('.pager')).toBeNull();
  });

  it('pages the batch: position and file name, readiness dots, dot selection and edge-disabled navigation', () => {
    draftCount.set(BATCH_DRAFT_COUNT);
    draftsReady.set(PAGER_READINESS);
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.pager__position').textContent).toContain(`${FIRST_DRAFT_INDEX + 1} из ${BATCH_DRAFT_COUNT}`);
    expect(element.querySelector('.pager__file').textContent.trim(), 'no source file yet — an empty name').toBe(EMPTY_FILE_NAME);

    const [previousButton, nextButton] = element.querySelectorAll('.pager__nav');

    expect(previousButton.disabled, 'no previous before the first draft').toBe(true);
    expect(nextButton.disabled).toBe(false);

    const dots = [...element.querySelectorAll('.pager__dot')];

    expect(dots).toHaveLength(BATCH_DRAFT_COUNT);
    expect(dots.map((dot) => dot.classList.contains('pager__dot_ready'))).toEqual(PAGER_READINESS);
    expect(dots.map((dot) => dot.getAttribute('aria-current'))).toEqual(EXPECTED_ARIA_CURRENT);
    expect(dots.map((dot) => dot.classList.contains('pager__dot_active'))).toEqual(EXPECTED_ACTIVE_DOTS);

    nextButton.click();

    expect(selectDraft).toHaveBeenCalledWith(MIDDLE_DRAFT_INDEX);

    dots[LAST_DRAFT_INDEX].click();

    expect(selectDraft).toHaveBeenCalledWith(LAST_DRAFT_INDEX);

    activeIndex.set(LAST_DRAFT_INDEX);
    sourceFile.set(PAGER_SOURCE_FILE);
    fixture.detectChanges();

    expect(element.querySelector('.pager__file').textContent.trim()).toBe(PAGER_SOURCE_FILE.name);
    expect(previousButton.disabled).toBe(false);
    expect(nextButton.disabled, 'no next past the last draft').toBe(true);

    previousButton.click();

    expect(selectDraft).toHaveBeenCalledWith(MIDDLE_DRAFT_INDEX);
    expect(selectDraft).toHaveBeenCalledTimes(3);
  });
});
