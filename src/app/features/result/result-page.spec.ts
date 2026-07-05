import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { PublishEventInput } from '../../core/github/publish-event.interface';
import { RaceEvent } from '../../core/models/race-event.interface';
import { PDF_EVENT_MOCK, PDF_ROWS_MOCK } from '../../core/pdf/protocol-doc-definition.mock';
import { AdminTokenService } from '../../github/admin-token.service';
import { PublishState, PublishStateType } from '../../github/github-storage.enum';
import { GithubStorageService } from '../../github/github-storage.service';
import { PdfService } from '../../pdf/pdf.service';
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
  EXPECTED_PDF_BYTES,
  EXPECTED_SUMMARY,
  EXPECTED_TITLE_LINE,
  FILE_NAME_MOCK,
  GENERATE_ERROR_MESSAGE,
  OBJECT_URL_MOCK,
  PUBLISHED_PDF_URL_MOCK,
  RESULT_BLOB_MOCK,
  SOURCE_FILE_MOCK,
  VK_URL_MOCK,
} from './result-page.mock';
import { PREVIEW_ROUTE_COMMANDS } from './result.guard.constant';

describe('ResultPage', () => {
  const event = signal<RaceEvent | null>(PDF_EVENT_MOCK);
  const protocolRows = signal(PDF_ROWS_MOCK);
  const sourceFile = signal<SourceFile | null>(SOURCE_FILE_MOCK);
  const generateProtocolBlob = vi.fn();
  const suggestedFileName = vi.fn(() => FILE_NAME_MOCK);
  const canShareFile = vi.fn(() => true);
  const shareFile = vi.fn(() => Promise.resolve(true));
  const copyToClipboard = vi.fn(() => Promise.resolve(true));
  const buildVkShareUrl = vi.fn(() => VK_URL_MOCK);
  const openWindow = vi.fn();
  const isAdmin = signal(true);
  const publishState = signal<PublishStateType>(PublishState.idle);
  const publishedPdfUrl = signal<string | null>(null);
  const publish = vi.fn((_input: PublishEventInput) => Promise.resolve());
  const reset = vi.fn();
  const createObjectURL = vi.fn(() => OBJECT_URL_MOCK);
  const revokeObjectURL = vi.fn();

  let fixture: ComponentFixture<ResultPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    event.set(PDF_EVENT_MOCK);
    sourceFile.set(SOURCE_FILE_MOCK);
    isAdmin.set(true);
    publishState.set(PublishState.idle);
    publishedPdfUrl.set(null);
    generateProtocolBlob.mockResolvedValue(RESULT_BLOB_MOCK);
    canShareFile.mockReturnValue(true);
    copyToClipboard.mockResolvedValue(true);
    // The router's fake platform navigation does `new URL()`, so the stub must stay constructible.
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProtocolStateService, useValue: { event, protocolRows, sourceFile } },
        { provide: PdfService, useValue: { generateProtocolBlob, suggestedFileName } },
        { provide: ShareService, useValue: { canShareFile, shareFile, copyToClipboard, buildVkShareUrl, openWindow } },
        { provide: GithubStorageService, useValue: { state: publishState, publishedPdfUrl, publish, reset } },
        { provide: AdminTokenService, useValue: { isAdmin } },
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

    expect(generateProtocolBlob).toHaveBeenCalledWith(PDF_EVENT_MOCK, PDF_ROWS_MOCK);
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

  it('hides the share button when the platform cannot share the file', async () => {
    canShareFile.mockReturnValue(false);
    fixture = await createPage();

    expect(fixture.componentInstance.canShare()).toBe(false);
    expect(canShareFile).toHaveBeenCalledWith(fixture.componentInstance.pdfFile());

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.result__share')).toBeNull();
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

  it('copies the description with a copied flag, accepts edits and opens the VK repost window', async () => {
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

    expect(buildVkShareUrl, 'the app origin stands in before publication').toHaveBeenCalledWith(location.origin, EDITED_DESCRIPTION);
    expect(openWindow).toHaveBeenCalledWith(VK_URL_MOCK);
  });

  it('publishes to the archive, renders every publish state and reposts to VK with the published url', async () => {
    fixture = await createPage();
    fixture.detectChanges();

    const element = fixture.nativeElement;

    element.querySelector('.result__publish-button').click();
    await settle();

    expect(publish).toHaveBeenCalledTimes(1);

    const publishInput = publish.mock.calls[0][0];

    expect(publishInput.event).toBe(PDF_EVENT_MOCK);
    expect(publishInput.rows).toBe(PDF_ROWS_MOCK);
    expect(publishInput.sourceXlsxBytes).toBe(SOURCE_FILE_MOCK.bytes);
    expect(Array.from(publishInput.pdfBytes)).toEqual(Array.from(EXPECTED_PDF_BYTES));

    publishState.set(PublishState.publishing);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-button').disabled).toBe(true);
    expect(element.querySelector('.result__publish-status')).not.toBeNull();
    expect(element.querySelector('.result__publish-feedback').getAttribute('aria-live')).toBe('polite');

    publishState.set(PublishState.success);
    publishedPdfUrl.set(PUBLISHED_PDF_URL_MOCK);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-link').getAttribute('href')).toBe(PUBLISHED_PDF_URL_MOCK);

    element.querySelector('.result__vk-open').click();

    expect(buildVkShareUrl).toHaveBeenCalledWith(PUBLISHED_PDF_URL_MOCK, EXPECTED_TITLE_LINE);

    publishState.set(PublishState.authError);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-admin')).not.toBeNull();

    publishState.set(PublishState.error);
    fixture.detectChanges();

    expect(element.querySelector('.result__publish-error').getAttribute('role')).toBe('alert');
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
