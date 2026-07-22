import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazemaster.app',
  appName: 'MazeMaster',
  webDir: 'dist',
  plugins: {
    AdMob: {
      // Initialize AdMob configuration if needed
    },
  },
};

export default config;
