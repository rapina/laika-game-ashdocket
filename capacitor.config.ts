import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sputnikworkshop.ashdocket',
  appName: 'Ash Docket',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
