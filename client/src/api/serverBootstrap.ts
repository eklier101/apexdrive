import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { getServerUrl, setServerUrl } from './client';

const BOOTSTRAP_APPLIED_KEY = 'vt_bootstrap_applied';

function normalizeUrl(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

function applyUrl(url: string): boolean {
  const cleaned = normalizeUrl(url);
  if (!cleaned || !/^https?:\/\//i.test(cleaned)) return false;
  const existing = getServerUrl();
  if (existing === cleaned) return true;
  // Only auto-fill when empty, or when user hasn't explicitly saved yet on native.
  if (Capacitor.isNativePlatform() && existing) return false;
  setServerUrl(cleaned);
  return true;
}

function urlFromDeepLink(link: string | null | undefined): string | null {
  if (!link) return null;
  try {
    if (link.startsWith('apexdrive://')) {
      const u = new URL(link.replace('apexdrive://', 'https://apexdrive/'));
      return u.searchParams.get('url') || u.searchParams.get('server') || null;
    }
    const u = new URL(link);
    return u.searchParams.get('url') || u.searchParams.get('server') || null;
  } catch {
    return null;
  }
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
    const fromLaunch = urlFromDeepLink(launch?.url);
    if (fromLaunch) applyUrl(fromLaunch);
  } catch {
    // ignore
  }

  CapApp.addListener('appUrlOpen', ({ url }) => {
    const parsed = urlFromDeepLink(url);
    if (parsed) {
      setServerUrl(normalizeUrl(parsed));
      window.location.reload();
    }
  });
}

export function configureDeepLink(serverUrl: string): string {
  return `apexdrive://configure?url=${encodeURIComponent(normalizeUrl(serverUrl))}`;
}
