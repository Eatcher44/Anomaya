// src/ads/AdBanner.js
import React from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export default function AdBanner({ adUnitId, position = 'bottom' }) {
  const isTop = position === 'top';
  return (
    <View
      style={{
        borderTopWidth: isTop ? 0 : 1,
        borderBottomWidth: isTop ? 1 : 0,
        borderColor: '#eee',
      }}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(e) => console.log('Banner error:', e)}
      />
    </View>
  );
}
