import { rawGithubFileUrl } from './raw-github';
import { EXPECTED_RAW_GITHUB_URL, RAW_GITHUB_FILE_PATH } from './raw-github.mock';

describe('rawGithubFileUrl', () => {
  it('builds the raw url of a repository file at the branch head', () => {
    expect(rawGithubFileUrl(RAW_GITHUB_FILE_PATH)).toBe(EXPECTED_RAW_GITHUB_URL);
  });
});
