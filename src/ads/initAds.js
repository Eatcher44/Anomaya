// src/ads/initAds.js
import { NativeModules } from 'react-native';

let mobileAdsFn = null;
let MaxAdContentRating = null;
let isAvailable = false;

try {
  const mod = require('react-native-google-mobile-ads');
  // default export = mobileAds (fonction)
  mobileAdsFn = mod?.default ?? null;
  MaxAdContentRating = mod?.MaxAdContentRating ?? null;
  // Le module natif doit exister pour que ça marche
  isAvailable =
    typeof mobileAdsFn === 'function' &&
    !!NativeModules?.RNGoogleMobileAdsModule;
} catch (_) {
  isAvailable = false;
}

/** Indique si le SDK pubs est disponible (prébuild/dev client/standalone) */
export function adsAvailable() {
  return isAvailable;
}

/**
 * Initialise AdMob (safe à rappeler).
 * @returns {Promise<boolean>} true si ok, false sinon
 */
export async function initAds() {
  if (!isAvailable) return false;
  try {
    if (MaxAdContentRating) {
      await mobileAdsFn().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        // testDeviceIdentifiers: ['EMULATOR'], // optionnel
      });
    }
    await mobileAdsFn().initialize();
    return true;
  } catch (e) {
    console.warn('[Ads] init error:', e?.message || String(e));
    return false;
  }
}

export default initAds;
