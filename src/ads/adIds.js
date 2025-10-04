// src/ads/adIds.js
import { TestIds } from 'react-native-google-mobile-ads';

export const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/BBBBBBBBBB'; // <-- mets ici TON vrai ad unit banner (avec /)

export const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/IIIIIIIIII'; // <-- mets ici TON vrai ad unit interstitiel (avec /)
