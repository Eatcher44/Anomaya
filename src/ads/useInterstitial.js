// src/ads/useInterstitial.js
import { useEffect } from 'react';
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { INTERSTITIAL_AD_UNIT_ID } from './adIds';

export default function useInterstitial(adUnitId = INTERSTITIAL_AD_UNIT_ID) {
  const {
    isLoaded,
    isClosed,
    load,
    show,
    error,
  } = useInterstitialAd(adUnitId, {
    requestOptions: {
      requestNonPersonalizedAdsOnly: true,
    },
  });

  // Charge à l'initialisation
  useEffect(() => {
    load();
  }, [load]);

  // Recharge automatiquement après fermeture
  useEffect(() => {
    if (isClosed) load();
  }, [isClosed, load]);

  return { isLoaded, show, reload: load, error };
}
