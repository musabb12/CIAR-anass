import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safir.nexusyemen',
  appName: 'NexusYemen',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  ios: {
    // These settings are placeholders; final Xcode adjustments should be done on macOS
    minVersion: '13.0',
    backgroundFetch: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: true
    }
  }
};

export default config;
