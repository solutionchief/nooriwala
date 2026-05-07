import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nooriwala.app',
  appName: 'Noori Wala',
  webDir: 'dist',
  server: {
    url: 'https://9de92dce-f3c0-40a8-929c-641585ce0d23.lovableproject.com?forceHideBadge=true',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
