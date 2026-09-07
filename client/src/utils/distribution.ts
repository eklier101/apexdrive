/** Build-time distribution channel (Vite mode / VITE_DISTRIBUTION). */
export type AppDistribution = 'play' | 'sideload' | 'web';

export function getAppDistribution(): AppDistribution {
  const raw = (import.meta.env.VITE_DISTRIBUTION || '').toLowerCase();
  if (raw === 'play') return 'play';
  if (raw === 'sideload') return 'sideload';
  // Default native builds without an explicit flag are treated as sideload (self-update OK).
  return 'sideload';
}

/** True when this binary must not offer in-app APK install (Google Play). */
export function isPlayDistribution(): boolean {
  return getAppDistribution() === 'play';
}

/** True when in-app APK download/install from the ApexDrive server is allowed. */
export function allowsSideloadUpdates(): boolean {
  return !isPlayDistribution();
}
