import {
  canAutoApplyServerUrl,
  normalizeServerUrl,
  serverUrlFromDeepLink,
} from './serverUrlPolicy';

export function verifyServerUrlPolicy(): void {
  const applyCases: Array<[string, string, ReturnType<typeof canAutoApplyServerUrl>]> = [
    ['', 'http://192.168.1.10:8090', 'apply'],
    ['', 'https://apex.example', 'apply'],
    ['http://192.168.1.10:8090', 'http://192.168.1.10:8090/', 'noop'],
    ['http://192.168.1.10:8090', 'https://evil.example', 'reject'],
    ['http://home:8090', 'javascript:alert(1)', 'reject'],
    ['', 'evil.example', 'reject'],
    ['http://home:8090', '', 'reject'],
  ];
  for (const [existing, incoming, want] of applyCases) {
    const got = canAutoApplyServerUrl(existing, incoming);
    if (got !== want) {
      throw new Error(
        `canAutoApplyServerUrl(${JSON.stringify(existing)}, ${JSON.stringify(incoming)}): got ${got} want ${want}`
      );
    }
  }

  if (normalizeServerUrl('http://x:8090/') !== 'http://x:8090') {
    throw new Error('normalizeServerUrl should strip trailing slash');
  }

  const hijack = serverUrlFromDeepLink('apexdrive://configure?url=https://evil.example');
  if (hijack !== 'https://evil.example') {
    throw new Error(`deep link parse failed: ${hijack}`);
  }
  if (canAutoApplyServerUrl('http://192.168.1.10:8090', hijack || '') !== 'reject') {
    throw new Error('configured app must ignore configure deep-link to a different host');
  }
}

verifyServerUrlPolicy();
