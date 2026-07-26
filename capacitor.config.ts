import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazemaster.app',
  appName: 'Maze Master',
  webDir: 'dist',
  plugins: {
    AdMob: {
      // Official Google AdMob Sample / Test App ID for Android
      androidAppId: 'ca-app-pub-3940256099942544~3347511713',
    },
  },
};

export default config;
