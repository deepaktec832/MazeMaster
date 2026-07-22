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

/**
 * Initialize Google AdMob Capacitor Plugin
 */
export async function initAdMob(): Promise<boolean> {
  try {
    await AdMob.initialize({
      initializeForTesting: true,
    });
    isAdMobInitialized = true;
    console.log('[AdMob Capacitor Plugin] Successfully initialized.');
    return true;
  } catch (error) {
    console.warn('[AdMob Capacitor Plugin] Web mode or native bridge not active. Fallback enabled.', error);
    isAdMobInitialized = false;
    return false;
  }
}

/**
 * Show AdMob Bottom Banner Ad (Test Unit ID: ca-app-pub-3940256099942544/6300978111)
 */
export async function showAdMobBanner(): Promise<boolean> {
  try {
    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111',
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    });
    return true;
  } catch (error) {
    console.warn('[AdMob Banner] Banner not supported natively in browser session:', error);
    return false;
  }
}

/**
 * Hide AdMob Bottom Banner Ad
 */
export async function hideAdMobBanner(): Promise<boolean> {
  try {
    await AdMob.hideBanner();
    return true;
  } catch {
    return false;
  }
}

/**
 * Show AdMob Interstitial Fullscreen Ad (Test Unit ID: ca-app-pub-3940256099942544/1033173712)
 */
export async function showAdMobInterstitial(): Promise<boolean> {
  try {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3940256099942544/1033173712',
      isTesting: true,
    });
    await AdMob.showInterstitial();
    return true;
  } catch (error) {
    console.warn('[AdMob Interstitial] Interstitial fallback triggered:', error);
    return false;
  }
}

/**
 * Show AdMob Rewarded Video Ad (Test Unit ID: ca-app-pub-3940256099942544/5224354911)
 */
export async function showAdMobRewarded(onRewarded: () => void): Promise<boolean> {
  try {
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
    console.warn('[AdMob Rewarded] Rewarded video fallback triggered:', error);
    return false;
  }
}

export const ADMOB_TEST_UNITS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354911',
};
