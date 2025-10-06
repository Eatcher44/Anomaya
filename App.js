// App.js
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
} from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';

// ✅ on importe TON écran existant (respecte bien la casse et le chemin)
import SignInScreen from './src/screens/auth/SignInScreen';

// ✅ Ton Banner Ad Unit ID réel
const BANNER_AD_UNIT_ID = 'ca-app-pub-1709670714425844/3039220820';

export default function App() {
  useEffect(() => {
    // (Optionnel) garder l'émulateur en mode test via code
    mobileAds().setRequestConfiguration({
      testDeviceIdentifiers: ['EMULATOR'],
    });

    // Initialise AdMob (ton AAID est déclaré en console → test device)
    mobileAds().initialize();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      {/* Ton écran de connexion (gère déjà GoogleSignin.configure) */}
      <SignInScreen />

      {/* Bannière AdMob (ad unit RÉELLE).
          Sur TON appareil déclaré en console, tu verras des annonces TEST. */}
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => console.log('Banner loaded')}
        onAdFailedToLoad={(e) => console.log('Banner error', e)}
      />
    </SafeAreaView>
  );
}
