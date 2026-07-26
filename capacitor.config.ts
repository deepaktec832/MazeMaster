import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazemaster.app',
  appName: 'Maze Master',
  webDir: 'dist',
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-3813652223447083~6768881455',
    },
  },
};

export default config;
