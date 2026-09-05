import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppVersionInfo } from '../types';
import { updateApi, CURRENT_VERSION_CODE, CURRENT_APP_VERSION } from '../api/updateApi';

interface UpdateContextType {
  currentVersion: string;
  currentVersionCode: number;
  latestRelease: AppVersionInfo | null;
  hasUpdate: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadedUri: string | null;
  autoDownloadWifi: boolean;
  isWifi: boolean;
  lastChecked: Date | null;
  setAutoDownloadWifi: (enabled: boolean) => void;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissBanner: () => void;
  bannerDismissed: boolean;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentVersion] = useState<string>(CURRENT_APP_VERSION);
  const [currentVersionCode] = useState<number>(CURRENT_VERSION_CODE);
  const [latestRelease, setLatestRelease] = useState<AppVersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadedUri, setDownloadedUri] = useState<string | null>(null);
  const [isWifi, setIsWifi] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const [autoDownloadWifi, setAutoDownloadWifiState] = useState<boolean>(() => {
    const saved = localStorage.getItem('vt_auto_download_wifi');
    return saved !== null ? saved === 'true' : true;
  });

  const setAutoDownloadWifi = (enabled: boolean) => {
    setAutoDownloadWifiState(enabled);
    localStorage.setItem('vt_auto_download_wifi', enabled ? 'true' : 'false');
  };

  const checkNetwork = async () => {
    const wifi = await updateApi.isWifiConnected();
    setIsWifi(wifi);
    return wifi;
  };

  const checkForUpdates = useCallback(async (manual: boolean = false) => {
    setIsChecking(true);
    try {
      const wifi = await checkNetwork();
      const releaseInfo = await updateApi.checkLatestVersion();
      setLatestRelease(releaseInfo);
      setLastChecked(new Date());

      if (releaseInfo && releaseInfo.available && releaseInfo.version_code > CURRENT_VERSION_CODE) {
        setHasUpdate(true);
        setBannerDismissed(false);

        // Auto download on Wi-Fi if enabled (ONLY on native Android app, never in web browser)
        if (Capacitor.isNativePlatform() && autoDownloadWifi && wifi && !downloadedUri && !isDownloading && releaseInfo.download_url) {
          console.log('Wi-Fi connection detected on Android device. Starting background auto-download...');
          downloadUpdateInternal(releaseInfo.download_url);
        }
      } else {
        setHasUpdate(false);
        if (manual) {
          alert(`You are running the latest version (v${CURRENT_APP_VERSION})`);
        }
      }
    } catch (err) {
      console.warn('Check update error:', err);
      if (manual) {
        alert('Could not connect to update server. Please check your network connection.');
      }
    } finally {
      setIsChecking(false);
    }
  }, [autoDownloadWifi, downloadedUri, isDownloading]);

  const downloadUpdateInternal = async (downloadUrl: string) => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const res = await updateApi.downloadApk(downloadUrl, (pct) => {
        setDownloadProgress(pct);
      });
      setDownloadedUri(res.uri);
      setDownloadProgress(100);
    } catch (err: any) {
      console.error('Download update error:', err);
      alert(`Failed to download update: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadUpdate = async () => {
    if (!latestRelease?.download_url) {
      await checkForUpdates(true);
      return;
    }
    await downloadUpdateInternal(latestRelease.download_url);
  };

  const installUpdate = async () => {
    if (!downloadedUri) {
      await downloadUpdate();
      return;
    }
    await updateApi.installApk(downloadedUri);
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
  };

  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return (
    <UpdateContext.Provider
      value={{
        currentVersion,
        currentVersionCode,
        latestRelease,
        hasUpdate,
        isChecking,
        isDownloading,
        downloadProgress,
        downloadedUri,
        autoDownloadWifi,
        isWifi,
        lastChecked,
        setAutoDownloadWifi,
        checkForUpdates,
        downloadUpdate,
        installUpdate,
        dismissBanner,
        bannerDismissed,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};
