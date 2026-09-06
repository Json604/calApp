import {Alert, NativeModules} from 'react-native';

const MANIFEST_HOSTS = [
  'https://cutlog.kartikey.xyz',
  'https://calapp.kartikey.xyz',
];

export type UpdateManifest = {
  versionCode: number;
  versionName: string;
  url: string;
  sha256: string;
  notes?: string;
  mandatory?: boolean;
};

type NativeUpdate = {
  getVersion(): Promise<{versionCode: number; versionName: string}>;
  downloadAndInstall(url: string, sha256: string): Promise<boolean>;
};

function nativeUpdate(): NativeUpdate | undefined {
  return NativeModules.CutLogUpdate as NativeUpdate | undefined;
}

let checkedThisSession = false;

export type UpdateProgress =
  | {status: 'idle'}
  | {status: 'downloading'; versionName: string};

let updateProgress: UpdateProgress = {status: 'idle'};
const progressListeners = new Set<(progress: UpdateProgress) => void>();

function setUpdateProgress(progress: UpdateProgress): void {
  updateProgress = progress;
  progressListeners.forEach(listener => listener(progress));
}

export function subscribeToUpdateProgress(
  listener: (progress: UpdateProgress) => void,
): () => void {
  progressListeners.add(listener);
  listener(updateProgress);
  return () => {
    progressListeners.delete(listener);
  };
}

export function parseUpdateManifest(
  value: unknown,
  sourceHost?: string,
): UpdateManifest | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const manifest = value as Record<string, unknown>;
  if (
    typeof manifest.versionCode !== 'number' ||
    !Number.isFinite(manifest.versionCode) ||
    typeof manifest.versionName !== 'string' ||
    typeof manifest.url !== 'string' ||
    typeof manifest.sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/i.test(manifest.sha256)
  ) {
    return null;
  }
  const url =
    sourceHost && /^https:\/\//.test(manifest.url)
      ? manifest.url.replace(/^https:\/\/[^/]+/, sourceHost)
      : manifest.url;
  return {
    versionCode: manifest.versionCode,
    versionName: manifest.versionName,
    url,
    sha256: manifest.sha256,
    notes: typeof manifest.notes === 'string' ? manifest.notes : undefined,
    mandatory: manifest.mandatory === true,
  };
}

async function fetchManifest(): Promise<UpdateManifest> {
  let lastError: Error | undefined;
  for (const host of MANIFEST_HOSTS) {
    try {
      const response = await fetch(`${host}/downloads/latest.json`, {
        headers: {'cache-control': 'no-cache'},
      });
      if (!response.ok) {
        throw new Error(`Update check failed (${response.status})`);
      }
      const parsed = parseUpdateManifest(await response.json(), host);
      if (!parsed) {
        throw new Error('Update manifest is malformed');
      }
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error('Update check failed');
}

export async function checkForUpdate(options?: {
  silent?: boolean;
}): Promise<void> {
  const silent = options?.silent ?? true;
  const native = nativeUpdate();
  if (!native) {
    return;
  }
  if (silent && checkedThisSession) {
    return;
  }
  checkedThisSession = true;

  let manifest: UpdateManifest;
  let current: {versionCode: number; versionName: string};
  try {
    const [body, version] = await Promise.all([
      fetchManifest(),
      native.getVersion(),
    ]);
    manifest = body;
    current = version;
  } catch (error) {
    if (!silent) {
      Alert.alert(
        "Couldn't check for updates",
        error instanceof Error ? error.message : String(error),
      );
    }
    return;
  }

  if (manifest.versionCode <= current.versionCode) {
    if (!silent) {
      Alert.alert(
        "You're up to date",
        `Version ${current.versionName} is the latest.`,
      );
    }
    return;
  }

  const install = () => {
    setUpdateProgress({
      status: 'downloading',
      versionName: manifest.versionName,
    });
    native
      .downloadAndInstall(manifest.url, manifest.sha256)
      .catch((error: unknown) => {
        Alert.alert(
          'Update failed',
          error instanceof Error ? error.message : String(error),
        );
      })
      .finally(() => setUpdateProgress({status: 'idle'}));
  };

  Alert.alert(
    `Update to ${manifest.versionName}`,
    manifest.notes?.trim()
      ? manifest.notes
      : `You're on ${current.versionName}. Android will ask you to confirm the install.`,
    manifest.mandatory
      ? [{text: 'Update', onPress: install}]
      : [
          {text: 'Later', style: 'cancel'},
          {text: 'Update', onPress: install},
        ],
    {cancelable: !manifest.mandatory},
  );
}

export async function currentVersion(): Promise<string> {
  const native = nativeUpdate();
  if (!native) {
    return '';
  }
  try {
    const {versionName} = await native.getVersion();
    return versionName;
  } catch {
    return '';
  }
}

export function resetUpdateCheckForTests(): void {
  checkedThisSession = false;
  setUpdateProgress({status: 'idle'});
}
