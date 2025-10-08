// App.js
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, ActivityIndicator, View, Text, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import mobileAds, { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';

const Stack = createNativeStackNavigator();
const BANNER_AD_UNIT_ID = 'ca-app-pub-1709670714425844/3039220820';

function HomeScreen({ navigation, route }) {
  const user = auth().currentUser;
  const name = user?.displayName || user?.email || 'Utilisateur';

  return (
    <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 8 }}>Bienvenue 👋</Text>
      <Text style={{ marginBottom: 16 }}>{name}</Text>
      <Pressable
        onPress={() => auth().signOut()}
        style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}
      >
        <Text>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // AdMob init
  useEffect(() => {
    mobileAds().setRequestConfiguration({ testDeviceIdentifiers: ['EMULATOR'] });
    mobileAds().initialize();
  }, []);

  // 🔥 Abonnement à l'état d'auth Firebase
  useEffect(() => {
    const unsub = auth().onAuthStateChanged(u => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, [initializing]);

  if (initializing) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        {user ? (
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Anomaya' }} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Connexion' }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Créer un compte' }} />
          </Stack.Navigator>
        )}
      </NavigationContainer>

      {/* Bannière AdMob en bas */}
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
