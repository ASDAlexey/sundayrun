import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { UploadPage } from './upload-page';

describe('UploadPage', () => {
  let fixture: ComponentFixture<UploadPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ProtocolStateService, useValue: { reset: vi.fn(), importFile: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
      ],
    });
    fixture = TestBed.createComponent(UploadPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the intake card around the shared dropzone', () => {
    const element = fixture.nativeElement;

    expect(element.querySelector('main').id).toBe('main');
    expect(element.querySelector('.upload__title')).not.toBeNull();
    expect(element.querySelector('app-protocol-dropzone .dropzone__zone')).not.toBeNull();
  });
});
