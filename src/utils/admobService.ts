import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  RewardAdPluginEvents,
  AdMobRewardItem,
} from '@capacitor-community/admob';

export interface AdMobStatus {
  initialized: boolean;
  isNative: boolean;
}

let isAdMobInitialized = false;
let initPromise: Promise<boolean> | null = null;
let bannerActive = false;

/**
 * Initialize Google AdMob Capacitor Plugin safely
 */
export async function initAdMob(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[AdMob] Running in web environment; skipping native plugin initialization.');
    return false;
  }

  if (isAdMobInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Delay to ensure Android Activity layout & WebView view tree are fully mounted
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await AdMob.initialize({
        initializeForTesting: true,
      });
      isAdMobInitialized = true;
      console.log('[AdMob] Native AdMob initialized successfully.');
      return true;
    } catch (error) {
      console.warn('[AdMob] Native initialization failed or AdMob App ID missing:', error);
      isAdMobInitialized = false;
      return false;
    }
  })();

  return initPromise;
}

/**
 * Show AdMob Bottom Banner Ad safely (Test Unit ID: ca-app-pub-3940256099942544/6300978111)
 */
export async function showAdMobBanner(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || bannerActive) {
    return false;
  }

  try {
    const initialized = await initAdMob();
    if (!initialized) return false;

    // Safety delay to guarantee native Activity view hierarchy is non-null
    await new Promise((resolve) => setTimeout(resolve, 800));

    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111',
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    });
    bannerActive = true;
    return true;
  } catch (error) {
    console.warn('[AdMob Banner] Banner display skipped or view not attached:', error);
    bannerActive = false;
    return false;
  }
}

/**
 * Hide AdMob Bottom Banner Ad safely
 */
export async function hideAdMobBanner(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await AdMob.hideBanner();
    bannerActive = false;
    return true;
  } catch {
    bannerActive = false;
    return false;
  }
}

/**
 * Show AdMob Interstitial Fullscreen Ad (Test Unit ID: ca-app-pub-3940256099942544/1033173712)
 */
export async function showAdMobInterstitial(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const initialized = await initAdMob();
    if (!initialized) return false;

    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3940256099942544/1033173712',
      isTesting: true,
    });
    await AdMob.showInterstitial();
    return true;
  } catch (error) {
    console.warn('[AdMob Interstitial] Interstitial ad skipped:', error);
    return false;
  }
}

/**
 * Show AdMob Rewarded Video Ad (Test Unit ID: ca-app-pub-3940256099942544/5224354911)
 */
export async function showAdMobRewarded(onRewarded: () => void): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const initialized = await initAdMob();
    if (!initialized) return false;

    const handle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (_reward: AdMobRewardItem) => {
      onRewarded();
      handle.remove();
    });

    await AdMob.prepareRewardVideoAd({
      adId: 'ca-app-pub-3940256099942544/5224354911',
      isTesting: true,
    });
    await AdMob.showRewardVideoAd();
    return true;
  } catch (error) {
    console.warn('[AdMob Rewarded] Rewarded video skipped:', error);
    return false;
  }
}

export const ADMOB_TEST_UNITS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354911',
};

