import { Capacitor, registerPlugin } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AppVersionInfo } from '../types';
import { getServerUrl } from './client';

export const CURRENT_APP_VERSION = '1.0.32';
export const CURRENT_VERSION_CODE = 10032;

interface ApkInstallerPluginInterface {
  installApk(options: { filePath: string }): Promise<{ success: boolean }>;
  validateApk(options: { filePath: string }): Promise<{
    success: boolean;
    packageName?: string;
    versionCode?: number;
    versionName?: string;
    size?: number;
  }>;
}

const ApkInstaller = registerPlugin<ApkInstallerPluginInterface>('ApkInstaller');

const MIN_APK_BYTES = 50_000;

function assertApkBytes(bytes: Uint8Array): void {
  if (bytes.byteLength < MIN_APK_BYTES) {
    throw new Error(
      `Downloaded APK is too small (${bytes.byteLength} bytes). The server may have returned an error instead of the package.`
    );
  }
  // ZIP / APK magic
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    const head = new TextDecoder().decode(bytes.slice(0, Math.min(80, bytes.byteLength)));
    if (head.trimStart().startsWith('{')) {
      throw new Error(
        'Download was JSON, not an APK. The server has no valid package (or integrity check failed).'
      );
    }
    throw new Error('Downloaded file is not a valid APK (missing ZIP/PK header).');
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const updateApi = {
  async checkLatestVersion(): Promise<AppVersionInfo> {
    const baseUrl = getServerUrl();
    const res = await fetch(`${baseUrl}/api/app/version`);
    if (!res.ok) throw new Error('Failed to check for updates');
    const data = (await res.json()) as AppVersionInfo;
    if (data.apk_valid === false) {
      data.available = false;
    }
    return data;
  },

  async isWifiConnected(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return navigator.onLine;
    }
    try {
      const status = await Network.getStatus();
      return status.connected && status.connectionType === 'wifi';
    } catch (err) {
      console.warn('Could not check network status:', err);
      return false;
    }
  },

  async downloadApk(
    downloadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<{ path: string; uri: string }> {
    const baseUrl = getServerUrl();
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${baseUrl}${downloadUrl}`;

    if (!Capacitor.isNativePlatform()) {
      // Probe that the server will actually serve an installable APK before saving.
      const probe = await fetch(fullUrl, { method: 'HEAD' }).catch(() => null);
      if (probe && !probe.ok) {
        throw new Error(`APK download unavailable (HTTP ${probe.status}).`);
      }
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = 'apexdrive_update.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { path: 'browser-download', uri: fullUrl };
    }

    try {
      const response = await fetch(fullUrl, {
        headers: { 'X-ApexDrive-Client': 'native', Accept: 'application/vnd.android.package-archive' },
      });
      const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.error) detail = String(errBody.error);
        } catch {
          /* ignore */
        }
        throw new Error(`Download failed: ${detail}`);
      }
      if (contentType.includes('application/json')) {
        throw new Error('Server returned JSON instead of an APK — package is missing or failed integrity check.');
      }

      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get('Content-Length') || 0);

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          if (contentLength > 0 && onProgress) {
            onProgress(Math.round((receivedLength / contentLength) * 100));
          }
        }
      }

      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      if (contentLength > 0 && receivedLength !== contentLength) {
        throw new Error(
          `Incomplete APK download (${receivedLength} of ${contentLength} bytes). Try again on Wi‑Fi.`
        );
      }
      assertApkBytes(allChunks);

      const fileName = 'update.apk';
      const result = await Filesystem.writeFile({
        path: fileName,
        data: uint8ToBase64(allChunks),
        directory: Directory.Cache,
      });

      const uriResult = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      // Native PackageManager parse — catches unsigned/corrupt packages before Install UI.
      try {
        await ApkInstaller.validateApk({ filePath: uriResult.uri });
      } catch (err: any) {
        try {
          await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
        } catch {
          /* ignore */
        }
        throw new Error(err?.message || 'Downloaded APK failed device validation');
      }

      if (onProgress) onProgress(100);
      return {
        path: result.uri,
        uri: uriResult.uri,
      };
    } catch (error) {
      console.error('Error downloading APK:', error);
      throw error;
    }
  },

  async installApk(fileUri: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      alert('APK installation is supported on Android devices. File has been downloaded to your browser.');
      return;
    }

    try {
      await ApkInstaller.validateApk({ filePath: fileUri });
      await ApkInstaller.installApk({ filePath: fileUri });
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('APK install blocked:', msg);
      alert(
        msg.includes('App not installed')
          ? msg
          : `${msg}\n\nIf this was an update across different signing keys, uninstall the old ApexDrive once, then install the new APK.`
      );
      throw err;
    }
  },
};
