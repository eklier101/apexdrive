import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { getServerUrl, setServerUrl } from './client';
import {
  canAutoApplyServerUrl,
  normalizeServerUrl,
  serverUrlFromDeepLink,
} from './serverUrlPolicy';

const BOOTSTRAP_APPLIED_KEY = 'vt_bootstrap_applied';

function applyUrl(url: string): boolean {
  const decision = canAutoApplyServerUrl(getServerUrl(), url);
  if (decision === 'reject') return false;
  if (decision === 'apply') {
    setServerUrl(normalizeServerUrl(url));
  }
  return true;
}

/** Load server URL from APK-embedded bootstrap JSON (written at download time). */
export async function applyServerBootstrap(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (getServerUrl()) return getServerUrl();

  try {
    const res = await fetch('/server-bootstrap.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.url && applyUrl(String(data.url))) {
        localStorage.setItem(BOOTSTRAP_APPLIED_KEY, '1');
        return getServerUrl();
      }
    }
  } catch {
    // ignore missing bootstrap
  }
  return null;
}

/** Listen for apexdrive://configure?url= deep links and cold-start launch URLs. */
export async function initServerUrlDeepLinks(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await applyServerBootstrap();

  try {
    const launch = await CapApp.getLaunchUrl();
    const fromLaunch = serverUrlFromDeepLink(launch?.url);
    if (fromLaunch) applyUrl(fromLaunch);
  } catch {
    // ignore
  }

  CapApp.addListener('appUrlOpen', ({ url }) => {
    const parsed = serverUrlFromDeepLink(url);
    if (!parsed) return;
    const before = getServerUrl();
    if (canAutoApplyServerUrl(before, parsed) !== 'apply') {
      return;
    }
    setServerUrl(normalizeServerUrl(parsed));
    window.location.reload();
  });
}

export function configureDeepLink(serverUrl: string): string {
  return `apexdrive://configure?url=${encodeURIComponent(normalizeServerUrl(serverUrl))}`;
}
