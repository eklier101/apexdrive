/** Normalize a host URL the same way Settings / auth persist it. */
export function normalizeServerUrl(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

/** Pull url/server from apexdrive://configure?url= or https://…?url= links. */
export function serverUrlFromDeepLink(link: string | null | undefined): string | null {
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

export type AutoApplyDecision = 'apply' | 'noop' | 'reject';

/**
 * Deep links and APK bootstrap may only fill an empty server URL.
 * Silently replacing a saved host would send the existing JWT to an
 * attacker-controlled server (apexdrive://configure?url=...).
 */
export function canAutoApplyServerUrl(existing: string, incoming: string): AutoApplyDecision {
  const cleaned = normalizeServerUrl(incoming);
  if (!cleaned || !/^https?:\/\//i.test(cleaned)) {
    return 'reject';
  }
  const have = normalizeServerUrl(existing);
  if (!have) {
    return 'apply';
  }
  if (have === cleaned) {
    return 'noop';
  }
  return 'reject';
}
