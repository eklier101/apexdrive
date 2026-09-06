import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apexdrive.app',
  appName: 'ApexDrive',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
