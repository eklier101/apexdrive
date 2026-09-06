import { Capacitor, registerPlugin } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AppVersionInfo } from '../types';
import { getServerUrl } from './client';

export const CURRENT_APP_VERSION = '1.0.31';
export const CURRENT_VERSION_CODE = 10031;

interface ApkInstallerPluginInterface {
  installApk(options: { filePath: string }): Promise<{ success: boolean }>;
}

const ApkInstaller = registerPlugin<ApkInstallerPluginInterface>('ApkInstaller');

export const updateApi = {
  // Check latest version from backend server
  async checkLatestVersion(): Promise<AppVersionInfo> {
    const baseUrl = getServerUrl();
    const res = await fetch(`${baseUrl}/api/app/version`);
    if (!res.ok) throw new Error('Failed to check for updates');
    return res.json();
  },

  // Check if device is connected to Wi-Fi
  async isWifiConnected(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return navigator.onLine; // In browser, treat online as Wi-Fi equivalent
    }
    try {
      const status = await Network.getStatus();
      return status.connected && status.connectionType === 'wifi';
    } catch (err) {
      console.warn('Could not check network status:', err);
      return false;
    }
  },

  // Download APK file to device storage
  async downloadApk(
    downloadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<{ path: string; uri: string }> {
    const baseUrl = getServerUrl();
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${baseUrl}${downloadUrl}`;

    if (!Capacitor.isNativePlatform()) {
      // In web browser, trigger standard browser file download
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = 'apexdrive_update.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { path: 'browser-download', uri: fullUrl };
    }

    // On native Android device — keep original package signature for in-place updates
    try {
      const sep = fullUrl.includes('?') ? '&' : '?';
      const updateUrl = `${fullUrl}${sep}preserve_signature=1`;
      const response = await fetch(updateUrl, {
        headers: { 'X-ApexDrive-Client': 'native' },
      });
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);

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
            const pct = Math.round((receivedLength / contentLength) * 100);
            onProgress(pct);
          }
        }
      }

      // Merge chunks into ArrayBuffer
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Convert to base64 for Capacitor Filesystem write
      let binary = '';
      const bytes = new Uint8Array(allChunks);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = window.btoa(binary);

      const fileName = 'update.apk';
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const uriResult = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      return {
        path: result.uri,
        uri: uriResult.uri,
      };
    } catch (error) {
      console.error('Error downloading APK:', error);
      throw error;
    }
  },

  // Launch Android package installer for downloaded APK
  async installApk(fileUri: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      alert('APK installation is supported on Android devices. File has been downloaded to your browser.');
      return;
    }

    try {
      // Call native Android PackageInstaller intent bridge
      await ApkInstaller.installApk({ filePath: fileUri });
    } catch (err: any) {
      console.warn('ApkInstaller plugin error, falling back to window.open:', err);
      try {
        window.open(fileUri, '_system');
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        alert('Could not launch package installer automatically. Please open the downloaded APK from your Downloads or Files folder.');
      }
    }
  },
};
