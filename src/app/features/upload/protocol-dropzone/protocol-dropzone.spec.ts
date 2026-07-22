import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ProtocolStateService } from '../../../state/protocol-state.service';
import { ProtocolDropzone } from './protocol-dropzone';
import { ENTER_KEY, PREVIEW_ROUTE_COMMANDS, SPACE_KEY } from './protocol-dropzone.constant';
import {
  DATED_FILE_NAME,
  FILE_BYTES,
  IMPORT_FAILURE,
  OTHER_KEY,
  SECOND_FILE_NAME,
  UPPER_CASE_FILE_NAME,
  WRONG_EXTENSION_FILE_NAME,
} from './protocol-dropzone.mock';

describe('ProtocolDropzone', () => {
  const reset = vi.fn();
  const importFiles = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));

  let fixture: ComponentFixture<ProtocolDropzone>;
  let dropzone: ProtocolDropzone;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: ProtocolStateService, useValue: { reset, importFiles } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    fixture = TestBed.createComponent(ProtocolDropzone);
    dropzone = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('toggles drag state and opens the file dialog from click, Enter and Space only', () => {
    const preventDefault = vi.fn();

    dropzone.onDragOver({ preventDefault });

    expect(dropzone.isDragOver()).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);

    dropzone.onDragLeave();

    expect(dropzone.isDragOver()).toBe(false);

    const click = vi.spyOn(dropzone.fileInput().nativeElement, 'click');

    dropzone.openFileDialog();
    dropzone.onZoneKeydown({ key: ENTER_KEY, preventDefault });
    dropzone.onZoneKeydown({ key: SPACE_KEY, preventDefault });
    dropzone.onZoneKeydown({ key: OTHER_KEY, preventDefault });

    expect(click).toHaveBeenCalledTimes(3);
    expect(preventDefault).toHaveBeenCalledTimes(3);
  });

  it('imports every dropped xlsx as one batch, resets the store first and navigates to preview', async () => {
    const preventDefault = vi.fn();
    const files = [new File([FILE_BYTES], DATED_FILE_NAME), new File([FILE_BYTES], SECOND_FILE_NAME)];

    dropzone.isDragOver.set(true);
    await dropzone.onDrop({ preventDefault, dataTransfer: { files } });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(dropzone.isDragOver()).toBe(false);
    expect(dropzone.hasError()).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(importFiles).toHaveBeenCalledTimes(1);
    expect(importFiles).toHaveBeenCalledWith([
      { name: DATED_FILE_NAME, bytes: FILE_BYTES },
      { name: SECOND_FILE_NAME, bytes: FILE_BYTES },
    ]);
    expect(navigate).toHaveBeenCalledWith(PREVIEW_ROUTE_COMMANDS);
    expect(reset.mock.invocationCallOrder[0]).toBeLessThan(importFiles.mock.invocationCallOrder[0]);
    expect(fixture.nativeElement.querySelector('.dropzone__input').multiple, 'the file dialog allows a multi-select').toBe(true);
  });

  it('ignores empty drops, rejects a batch with any non-xlsx name, accepts uppercase extension and reports import failures', async () => {
    await dropzone.onDrop({ preventDefault: vi.fn(), dataTransfer: null });
    await dropzone.onDrop({ preventDefault: vi.fn(), dataTransfer: { files: [] } });
    await dropzone.onFileSelected(null);

    expect(dropzone.hasError()).toBe(false);
    expect(importFiles).not.toHaveBeenCalled();
    expect(reset).toHaveBeenCalledTimes(3);

    await dropzone.onFileSelected([new File([FILE_BYTES], DATED_FILE_NAME), new File([FILE_BYTES], WRONG_EXTENSION_FILE_NAME)]);

    expect(dropzone.hasError(), 'one bad file fails the whole drop, nothing is imported').toBe(true);
    expect(importFiles).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    await dropzone.onFileSelected([new File([FILE_BYTES], UPPER_CASE_FILE_NAME)]);

    expect(dropzone.hasError()).toBe(false);
    expect(importFiles).toHaveBeenCalledWith([{ name: UPPER_CASE_FILE_NAME, bytes: FILE_BYTES }]);
    expect(navigate).toHaveBeenCalledTimes(1);

    importFiles.mockImplementationOnce(() => {
      throw IMPORT_FAILURE;
    });
    await dropzone.onFileSelected([new File([FILE_BYTES], DATED_FILE_NAME)]);

    expect(dropzone.hasError()).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(7);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dropzone__error').getAttribute('role')).toBe('alert');
  });
});
