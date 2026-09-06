import {Alert, NativeModules} from 'react-native';
import {
  checkForUpdate,
  parseUpdateManifest,
  resetUpdateCheckForTests,
} from '../../src/update/updateChecker';

const sha = 'a'.repeat(64);

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    versionCode: 2,
    versionName: '1.1',
    url: 'https://cutlog.kartikey.xyz/downloads/cutlog-1.1.apk',
    sha256: sha,
    ...overrides,
  };
}

describe('parseUpdateManifest', () => {
  it('accepts a valid manifest and rewrites the host that answered', () => {
    const parsed = parseUpdateManifest(
      manifest(),
      'https://calapp.kartikey.xyz',
    );
    expect(parsed?.url).toBe(
      'https://calapp.kartikey.xyz/downloads/cutlog-1.1.apk',
    );
    expect(parsed?.versionCode).toBe(2);
  });

  it('rejects a bad checksum', () => {
    expect(parseUpdateManifest(manifest({sha256: 'nope'}))).toBeNull();
  });
});

describe('checkForUpdate', () => {
  const getVersion = jest.fn();
  const downloadAndInstall = jest.fn();
  const alert = jest.spyOn(Alert, 'alert');
  const fetchMock = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetUpdateCheckForTests();
    getVersion.mockReset();
    downloadAndInstall.mockReset().mockResolvedValue(true);
    NativeModules.CutLogUpdate = {getVersion, downloadAndInstall};
    alert.mockReset();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    NativeModules.CutLogUpdate = undefined;
  });

  it('does not prompt when the phone is already on the published build', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => manifest({versionCode: 2}),
    });
    getVersion.mockResolvedValue({versionCode: 2, versionName: '1.1'});

    await checkForUpdate();

    expect(alert).not.toHaveBeenCalled();
    expect(downloadAndInstall).not.toHaveBeenCalled();
  });

  it('offers an update when latest.json is newer', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        manifest({notes: 'Voice logging talks to Groq again.'}),
    });
    getVersion.mockResolvedValue({versionCode: 1, versionName: '1.0'});

    await checkForUpdate();

    expect(alert).toHaveBeenCalledWith(
      'Update to 1.1',
      'Voice logging talks to Groq again.',
      expect.any(Array),
      expect.any(Object),
    );
  });

  it('falls back to the second host when the first fails', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('DNS'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => manifest(),
      });
    getVersion.mockResolvedValue({versionCode: 1, versionName: '1.0'});

    await checkForUpdate();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(alert).toHaveBeenCalled();
  });
});
