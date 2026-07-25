import {
  ROSTER_CACHED_AT_MS,
  ROSTER_CACHED_DATE_TEXT,
  choicelessPromptEvent,
  foreignPromptEvent,
  installPromptEvent,
  nonCallablePromptEvent,
} from './install-prompt.mock';
import { formatRosterDate, isInstallPromptEvent } from './install-prompt.view';

describe('install prompt view helpers', () => {
  it('recognises the Chromium event only by the two members it is used through', () => {
    expect(isInstallPromptEvent(installPromptEvent())).toBe(true);
    expect(isInstallPromptEvent(foreignPromptEvent()), 'a bare event of the same name is not it').toBe(false);
    expect(isInstallPromptEvent(nonCallablePromptEvent()), 'nor is a `prompt` that cannot be called').toBe(false);
    expect(isInstallPromptEvent(choicelessPromptEvent()), 'nor one whose answer never arrives').toBe(false);
  });

  it('dates the cached directory the way the rest of the site does', () => {
    expect(formatRosterDate(ROSTER_CACHED_AT_MS)).toBe(ROSTER_CACHED_DATE_TEXT);
  });
});
