import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';

import { readTracks } from '../../../state/athlete-track.storage';
import { TRACK_MOCK } from '../../../state/athlete-track.mock';
import { buildTrackArchive } from '../../../state/track-archive';
import { ARCHIVED_TRACK_MOCK } from '../../../state/track-archive.mock';
import { TrackSyncStatus } from '../../../state/track-sync.enum';
import { TrackSyncService } from '../../../state/track-sync.service';
import { WatchAccountService } from '../../../state/watch-account.service';
import { STORED_WATCH_ACCOUNT } from '../../../state/watch-account.service.mock';
import { CorosRegion } from '../../../core/coros/coros-region.enum';
import { WatchSync } from './watch-sync';
import { WATCH_FORM_EMAIL_MOCK, WATCH_FORM_PASSWORD_MOCK, WATCH_RACES_MOCK } from './watch-sync.mock';

describe('WatchSync', () => {
  const account = signal<typeof STORED_WATCH_ACCOUNT | null>(null);
  const tracks = signal<(typeof TRACK_MOCK)[]>([]);
  const status = signal(TrackSyncStatus.idle);
  const link = vi.fn(() => Promise.resolve());
  const unlink = vi.fn(() => Promise.resolve());
  const load = vi.fn(() => Promise.resolve());
  const sync = vi.fn(() => Promise.resolve());

  let fixture: ComponentFixture<WatchSync>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WatchAccountService,
          useValue: { account, linked: () => account() !== null, link, unlink },
        },
        { provide: TrackSyncService, useValue: { tracks, status, load, sync } },
      ],
    });
    vi.clearAllMocks();
    account.set(null);
    tracks.set([]);
    status.set(TrackSyncStatus.idle);
    vi.stubGlobal('indexedDB', new IDBFactory());

    fixture = TestBed.createComponent(WatchSync);
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('syncs once the races arrive, and only once', async () => {
    fixture.componentRef.setInput('races', WATCH_RACES_MOCK);
    await fixture.whenStable();

    expect(load).toHaveBeenCalled();
    expect(sync).toHaveBeenCalledWith(WATCH_RACES_MOCK);

    fixture.componentRef.setInput('races', [...WATCH_RACES_MOCK]);
    await fixture.whenStable();

    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('links from the form, forgets the password and closes it', async () => {
    const component = fixture.componentInstance;

    component.toggleForm();
    component.onEmail(WATCH_FORM_EMAIL_MOCK);
    component.onPassword(WATCH_FORM_PASSWORD_MOCK);
    component.onRegion(CorosRegion.Cn);
    component.onRegion('nowhere');

    expect(component.region()).toBe(CorosRegion.Cn);

    await component.link();

    expect(link).toHaveBeenCalledWith(WATCH_FORM_EMAIL_MOCK, WATCH_FORM_PASSWORD_MOCK, CorosRegion.Cn);
    expect(component.password()).toBe('');
    expect(component.formOpen()).toBe(false);
    expect(component.linkFailed()).toBe(false);
  });

  it('reports a refused login and keeps the form open', async () => {
    const component = fixture.componentInstance;

    link.mockRejectedValueOnce(new Error('bad password'));
    component.toggleForm();
    await component.link();

    expect(component.linkFailed()).toBe(true);
    expect(component.formOpen()).toBe(true);
  });

  it('unlinks and reloads what is left', async () => {
    account.set(STORED_WATCH_ACCOUNT);

    await fixture.componentInstance.unlink();

    expect(unlink).toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
  });

  it('exports the tracks as a download and imports an archive back', async () => {
    const component = fixture.componentInstance;
    const createObjectURL = vi.fn(() => 'blob:tracks');
    const revokeObjectURL = vi.fn();
    // The anchor is real; only the navigation it would trigger is stubbed away.
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    tracks.set([ARCHIVED_TRACK_MOCK]);
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    component.exportTracks();

    expect(component.trackCount()).toBe(1);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:tracks');

    const archive = new Uint8Array(buildTrackArchive([ARCHIVED_TRACK_MOCK]));

    await component.importTracks(null);

    expect(await readTracks()).toEqual([]);

    await component.importTracks(new File([archive], 'tracks.zip'));

    expect((await readTracks())[0].slug).toBe(ARCHIVED_TRACK_MOCK.slug);
    click.mockRestore();
  });
});
