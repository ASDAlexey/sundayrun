import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { PublishEventInput } from '../../core/github/publish-event.interface';
import { RaceEvent } from '../../core/models/race-event.interface';
import { PDF_EVENT_MOCK, PDF_PREVIOUS_BESTS_MOCK, PDF_ROWS_MOCK } from '../../core/pdf/protocol-doc-definition.mock';
import { AdminTokenService } from '../../github/admin-token.service';
import { CdnRefService } from '../../github/cdn-ref.service';
import { cdnRefServiceMock } from '../../github/cdn-ref.service.mock';
import { DbFreshness } from '../../github/db-freshness.enum';
import { DbFreshnessService } from '../../github/db-freshness.service';
import { dbFreshnessServiceMock } from '../../github/db-freshness.service.mock';
import { PublishState, PublishStateType } from '../../github/github-storage.enum';
import { GithubStorageService } from '../../github/github-storage.service';
import { PendingArchiveService } from '../../github/pending-archive.service';
import { pendingArchiveMock } from '../../github/pending-archive.service.mock';
import { PublishDurationService } from '../../github/publish-duration.service';
import { PUBLISH_DURATION_AVERAGE_MOCK, publishDurationServiceMock } from '../../github/publish-duration.service.mock';
import { ResultsService } from '../../github/results.service';
import { PdfService } from '../../pdf/pdf.service';
import { ProtocolImageService } from '../../pdf/protocol-image.service';
import { PROTOCOL_IMAGE_MIME_TYPE } from '../../pdf/protocol-image.service.constant';
import { ShareService } from '../../share/share.service';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { SourceFile } from '../../state/source-file.interface';
import { settle } from '../spec-utils/settle';
import { ResultPage } from './result-page';
import { EMPTY_TEXT, PDF_MIME_TYPE } from './result-page.constant';
import { ResultStatus } from './result-page.enum';
import {
  EDITED_DESCRIPTION,
  EXPECTED_DESCRIPTION,
  EXPECTED_IMAGE_FILE_NAME,
  EXPECTED_RESULT_FINISH_COUNTS,
  EXPECTED_SUMMARY,
  EXPECTED_TITLE_LINE,
  FILE_NAME_MOCK,
  FINISH_COUNTS_ERROR_MESSAGE,
  GENERATE_ERROR_MESSAGE,
  OBJECT_URL_MOCK,
  PROTOCOL_IMAGE_BLOB_MOCK,
  RESULT_BLOB_MOCK,
  RUN_PHOTO_MOCK,
  SOURCE_FILE_MOCK,
  VK_URL_MOCK,
} from './result-page.mock';
import { PREVIEW_ROUTE_COMMANDS } from './result.guard.constant';

describe('ResultPage', () => {
  const event = signal<RaceEvent | null>(PDF_EVENT_MOCK);
  const protocolRows = signal(PDF_ROWS_MOCK);
  const sourceFile = signal<SourceFile | null>(SOURCE_FILE_MOCK);
  const generateProtocolBlob = vi.fn();
  const loadFinishCountsBefore = vi.fn();
  const loadPreviousBestsBefore = vi.fn();
  const suggestedFileName = vi.fn(() => FILE_NAME_MOCK);
  const canShareFile = vi.fn(() => true);
  const canShareFiles = vi.fn((_files: File[]) => true);
  const shareFile = vi.fn(() => Promise.resolve(true));
  const shareFiles = vi.fn((_files: File[], _title: string, _text: string) => Promise.resolve(true));
  const render = vi.fn((_pdf: Blob) => Promise.resolve<Blob>(PROTOCOL_IMAGE_BLOB_MOCK));
  const copyToClipboard = vi.fn(() => Promise.resolve(true));
  const buildVkShareUrl = vi.fn(() => VK_URL_MOCK);
  const openWindow = vi.fn();
  const isAdmin = signal(true);
  const publishState = signal<PublishStateType>(PublishState.idle);
  const publish = vi.fn((_input: PublishEventInput) => Promise.resolve());
  const reset = vi.fn();
  const pendingArchive = pendingArchiveMock();
  const dbFreshness = dbFreshnessServiceMock();
  const publishDuration = publishDurationServiceMock();
  const cdnRef = cdnRefServiceMock();
  const createObjectURL = vi.fn(() => OBJECT_URL_MOCK);
  const revokeObjectURL = vi.fn();

  let fixture: ComponentFixture<ResultPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    event.set(PDF_EVENT_MOCK);
    sourceFile.set(SOURCE_FILE_MOCK);
    isAdmin.set(true);
    publishState.set(PublishState.idle);
    generateProtocolBlob.mockResolvedValue(RESULT_BLOB_MOCK);
    loadFinishCountsBefore.mockResolvedValue({});
    loadPreviousBestsBefore.mockResolvedValue(PDF_PREVIOUS_BESTS_MOCK);
    render.mockResolvedValue(PROTOCOL_IMAGE_BLOB_MOCK);
    canShareFile.mockReturnValue(true);
    canShareFiles.mockReturnValue(true);
    copyToClipboard.mockResolvedValue(true);
    dbFreshness.state.set(DbFreshness.Fresh);
    dbFreshness.pinnedDbAvailable.mockResolvedValue(true);
    publishDuration.averageMs.set(null);
    // The router's fake platform navigation does `new URL()`, so the stub must stay constructible.
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProtocolStateService, useValue: { event, protocolRows, sourceFile } },
        { provide: PdfService, useValue: { generateProtocolBlob, suggestedFileName } },
        { provide: ResultsService, useValue: { loadFinishCountsBefore, loadPreviousBestsBefore } },
        { provide: ProtocolImageService, useValue: { render } },
        {
          provide: ShareService,
          useValue: { canShareFile, canShareFiles, shareFile, shareFiles, copyToClipboard, buildVkShareUrl, openWindow },
        },
        { provide: GithubStorageService, useValue: { state: publishState, publish, reset } },
        { provide: PendingArchiveService, useValue: pendingArchive },
        { provide: AdminTokenService, useValue: { isAdmin } },
        { provide: DbFreshnessService, useValue: dbFreshness },
        { provide: PublishDurationService, useValue: publishDuration },
        { provide: CdnRefService, useValue: cdnRef },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  async function createPage(): Promise<ComponentFixture<ResultPage>> {
    const created = TestBed.createComponent(ResultPage);

    await settle();

    return created;
  }

  it('generates the pdf on creation, shows the ready state with download/share and revokes the url on destroy', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(loadFinishCountsBefore).toHaveBeenCalledWith(PDF_EVENT_MOCK.dateIso);
    expect(loadPreviousBestsBefore).toHaveBeenCalledWith(PDF_EVENT_MOCK.dateIso);
    expect(generateProtocolBlob).toHaveBeenCalledWith(
      PDF_EVENT_MOCK,
      PDF_ROWS_MOCK,
      EXPECTED_RESULT_FINISH_COUNTS,
      PDF_PREVIOUS_BESTS_MOCK,
    );
    expect(reset, 'a stale publish state of the previous event is cleared on entry').toHaveBeenCalled();
    expect(page.status()).toBe(ResultStatus.ready);
    expect(createObjectURL).toHaveBeenCalledWith(RESULT_BLOB_MOCK);
    expect(page.objectUrl()).toBe(OBJECT_URL_MOCK);
    expect(page.summary()).toBe(EXPECTED_SUMMARY);
    expect(page.description()).toBe(EXPECTED_DESCRIPTION);
    expect(page.previewUrl()).not.toBeNull();

    const file = page.pdfFile();

    expect(file?.name).toBe(FILE_NAME_MOCK);
    expect(file?.type).toBe(PDF_MIME_TYPE);
    expect(page.canShare()).toBe(true);
    expect(canShareFile).toHaveBeenCalledWith(file);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const download = element.querySelector('.result__download');

    expect(download.getAttribute('href')).toBe(OBJECT_URL_MOCK);
    expect(download.getAttribute('download')).toBe(FILE_NAME_MOCK);
    expect(element.querySelector('.result__preview').getAttribute('src')).toBe(OBJECT_URL_MOCK);

    element.querySelector('.result__share').click();

    expect(shareFile).toHaveBeenCalledWith(file, EXPECTED_TITLE_LINE, EXPECTED_DESCRIPTION);

    fixture.destroy();

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL_MOCK);
  });

  it('hides the share button and falls back to download + VK dialog when files cannot be shared', async () => {
    canShareFile.mockReturnValue(false);
    canShareFiles.mockReturnValue(false);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.canShare()).toBe(false);
    expect(canShareFile).toHaveBeenCalledWith(page.pdfFile());

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.result__share')).toBeNull();

    await page.openVk();

    expect(render, 'the protocol is rasterized to an image for VK').toHaveBeenCalledWith(RESULT_BLOB_MOCK);
    expect(shareFiles, 'no web-share sheet when files cannot be shared').not.toHaveBeenCalled();
    expect(createObjectURL, 'preview url on entry + the downloaded protocol image').toHaveBeenCalledTimes(2);
    expect(buildVkShareUrl).toHaveBeenCalledWith(location.origin, EXPECTED_TITLE_LINE);
    expect(openWindow).toHaveBeenCalledWith(VK_URL_MOCK);
  });

  it('still renders the pdf with a blank «Участий» column and undated «ЛР» notes when the stored history cannot be read', async () => {
    loadFinishCountsBefore.mockRejectedValueOnce(new Error(FINISH_COUNTS_ERROR_MESSAGE));
    loadPreviousBestsBefore.mockRejectedValueOnce(new Error(FINISH_COUNTS_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'the history is garnish — the protocol still renders').toBe(ResultStatus.ready);
    expect(generateProtocolBlob).toHaveBeenCalledWith(PDF_EVENT_MOCK, PDF_ROWS_MOCK, {}, {});
  });

  it('shows the error state when generation fails, guards sharing/publishing and navigates back to the preview', async () => {
    generateProtocolBlob.mockRejectedValueOnce(new Error(GENERATE_ERROR_MESSAGE));
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(ResultStatus.error);
    expect(page.objectUrl()).toBeNull();
    expect(page.previewUrl()).toBeNull();
    expect(page.pdfFile()).toBeNull();
    expect(page.canShare()).toBe(false);
    expect(canShareFile).not.toHaveBeenCalled();

    await page.share();

    expect(shareFile).not.toHaveBeenCalled();

    await page.publish();

    expect(publish, 'publishing needs the generated blob').not.toHaveBeenCalled();

    await page.openVk();

    expect(render, 'nothing to rasterize when generation failed').not.toHaveBeenCalled();
    expect(openWindow, 'VK still falls back to the url dialog').toHaveBeenCalledWith(VK_URL_MOCK);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.result__error').getAttribute('role')).toBe('alert');

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.nativeElement.querySelector('.result__back').click();

    expect(navigate).toHaveBeenCalledWith(PREVIEW_ROUTE_COMMANDS);
  });

  it('falls into the error state immediately when the event is missing', async () => {
    event.set(null);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(ResultStatus.error);
    expect(generateProtocolBlob).not.toHaveBeenCalled();
    expect(page.summary()).toBe(EMPTY_TEXT);
    expect(page.fileName()).toBe(EMPTY_TEXT);
    expect(page.description()).toBe(EMPTY_TEXT);

    await page.publish();

    expect(publish, 'publishing needs the event').not.toHaveBeenCalled();
  });

  it('copies the description with a copied flag, accepts edits and shares the protocol image to VK', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    fixture.detectChanges();

    const element = fixture.nativeElement;

    element.querySelector('.result__copy').click();
    await settle();

    expect(copyToClipboard).toHaveBeenCalledWith(EXPECTED_DESCRIPTION);
    expect(page.copied()).toBe(true);

    copyToClipboard.mockResolvedValueOnce(false);
    element.querySelector('.result__copy').click();
    await settle();

    expect(page.copied()).toBe(false);

    const textarea = element.querySelector('.result__vk-text');

    textarea.value = EDITED_DESCRIPTION;
    textarea.dispatchEvent(new Event('input'));

    expect(page.description()).toBe(EDITED_DESCRIPTION);

    element.querySelector('.result__vk-open').click();
    await settle();

    expect(render, 'the protocol is rasterized to a png for VK').toHaveBeenCalledWith(RESULT_BLOB_MOCK);

    const [files, title, text] = shareFiles.mock.calls[0];

    expect(files.length, 'only the protocol image, no run photo picked').toBe(1);
    expect(files[0].name).toBe(EXPECTED_IMAGE_FILE_NAME);
    expect(files[0].type).toBe(PROTOCOL_IMAGE_MIME_TYPE);
    expect(title).toBe(EDITED_DESCRIPTION);
    expect(text).toBe(EDITED_DESCRIPTION);
    expect(openWindow, 'the web-share sheet replaces the url dialog when files can travel').not.toHaveBeenCalled();
  });

  it('attaches the picked run photo alongside the protocol image when sharing to VK', async () => {
    fixture = await createPage();
    fixture.detectChanges();

    const page = fixture.componentInstance;
    const element = fixture.nativeElement;
    const input = element.querySelector('input[type="file"]');

    Object.defineProperty(input, 'files', { value: [RUN_PHOTO_MOCK], configurable: true });
    page.onRunPhotoSelected(input);
    fixture.detectChanges();

    expect(page.runPhotoName()).toBe(RUN_PHOTO_MOCK.name);
    expect(element.querySelector('.result__vk-photo-name').textContent).toContain(RUN_PHOTO_MOCK.name);

    await page.openVk();

    const [files] = shareFiles.mock.calls[0];

    expect(files.length, 'the protocol image plus the run photo').toBe(2);
    expect(files[0].name).toBe(EXPECTED_IMAGE_FILE_NAME);
    expect(files[1], 'the run photo rides along untouched').toBe(RUN_PHOTO_MOCK);

    await page.openVk();

    expect(render, 'the rasterized image is cached, not rebuilt on every share').toHaveBeenCalledOnce();

    Object.defineProperty(input, 'files', { value: null, configurable: true });
    page.onRunPhotoSelected(input);

    expect(page.runPhotoName(), 'clearing the picker drops the attached photo').toBe('');
  });

  it('publishes to the archive and renders every publish state', async () => {
    fixture = await createPage();
    fixture.detectChanges();

    const element = fixture.nativeElement;

    // A publish that never reaches success records nothing.
    element.querySelector('.result__publish-button').click();
    await settle();

    expect(publish).toHaveBeenCalledTimes(1);

    const publishInput = publish.mock.calls[0][0];

    expect(publishInput.event).toBe(PDF_EVENT_MOCK);
    expect(publishInput.rows).toBe(PDF_ROWS_MOCK);
    expect(publishInput.sourceXlsxBytes).toBe(SOURCE_FILE_MOCK.bytes);
    expect('pdfBytes' in publishInput, 'the protocol pdf is generated on the fly, never published').toBe(false);
    expect(pendingArchive.addUpload, 'an unfinished publish is not remembered').not.toHaveBeenCalled();

    // A successful publish is remembered for /admin and locks the button against a re-publish.
    publish.mockImplementation(() => {
      publishState.set(PublishState.success);

      return Promise.resolve();
    });
    element.querySelector('.result__publish-button').click();
    await settle();

    expect(pendingArchive.addUpload).toHaveBeenCalledWith({
      slug: PDF_EVENT_MOCK.dateIso,
      number: PDF_EVENT_MOCK.number,
      dateIso: PDF_EVENT_MOCK.dateIso,
      participantCount: PDF_ROWS_MOCK.length,
      atIso: expect.any(String),
    });

    fixture.detectChanges();

    expect(element.querySelector('.result__publish-button').disabled, 'a published event cannot be re-published').toBe(true);
    expect(publishDuration.record, 'an instantly-available deploy is still measured').toHaveBeenCalledTimes(1);
    expect(
      element.querySelector('.result__publish-open').getAttribute('href'),
      'the race link opens the just-published protocol',
    ).toContain(PDF_EVENT_MOCK.dateIso);

    publishState.set(PublishState.publishing);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-button').disabled).toBe(true);
    expect(element.querySelector('.result__publish-status')).not.toBeNull();
    expect(element.querySelector('.result__publish-feedback').getAttribute('aria-live')).toBe('polite');

    publishState.set(PublishState.success);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-status'), 'the success state renders without an archived-pdf link').not.toBeNull();
    expect(element.querySelector('.result__publish-link'), 'there is no archived pdf to link to').toBeNull();

    publishState.set(PublishState.authError);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-admin')).not.toBeNull();

    publishState.set(PublishState.error);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-error').getAttribute('role')).toBe('alert');
  });

  it('ticks the elapsed wait with the average hint, completes via the freshness poll and records the duration', async () => {
    publishDuration.averageMs.set(PUBLISH_DURATION_AVERAGE_MOCK);
    dbFreshness.pinnedDbAvailable.mockResolvedValue(false);
    publish.mockImplementation(() => {
      publishState.set(PublishState.success);

      return Promise.resolve();
    });
    fixture = await createPage();

    vi.useFakeTimers();

    const page = fixture.componentInstance;
    const element = fixture.nativeElement;

    await page.publish();
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-spinner'), 'the wait spins until the deploy lands').not.toBeNull();
    expect(element.querySelector('.result__publish-average').textContent, 'the measured average replaces the hardcoded hint').toContain(
      '2:30',
    );

    await vi.advanceTimersByTimeAsync(65_000);

    expect(page.elapsedText(), 'the elapsed counter ticks second by second').toBe('1:05');

    // The freshness poll walks Updating → Updated once the sha-named db lands.
    dbFreshness.state.set(DbFreshness.Updating);
    fixture.detectChanges();
    dbFreshness.state.set(DbFreshness.Updated);
    fixture.detectChanges();

    expect(page.deployDone()).toBe(true);
    expect(publishDuration.record, 'the click-to-live time feeds the average').toHaveBeenCalledWith(65_000);
    expect(page.publishedInText()).toBe('1:05');

    vi.useRealTimers();
  });

  it('ends the wait without a measured time when the freshness poll gives up', async () => {
    dbFreshness.pinnedDbAvailable.mockResolvedValue(false);
    publish.mockImplementation(() => {
      publishState.set(PublishState.success);

      return Promise.resolve();
    });
    fixture = await createPage();

    const page = fixture.componentInstance;

    await page.publish();

    dbFreshness.state.set(DbFreshness.Updating);
    fixture.detectChanges();
    dbFreshness.state.set(DbFreshness.Fresh);
    fixture.detectChanges();

    expect(page.deployDone(), 'a given-up poll still ends the wait').toBe(true);
    expect(publishDuration.record, 'an unmeasured deploy never skews the average').not.toHaveBeenCalled();
    expect(page.publishedInText()).toBeNull();
  });

  it('skips publishing without the source file and hides the publish section for non-admins', async () => {
    sourceFile.set(null);
    fixture = await createPage();

    await fixture.componentInstance.publish();

    expect(publish, 'publishing needs the source xlsx').not.toHaveBeenCalled();

    isAdmin.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.result__publish')).toBeNull();
  });
});
