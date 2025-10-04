// src/navigation/index.js
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BANNER_AD_UNIT_ID } from '../ads/adIds';
import AdBanner from '../ads/AdBanner';

import HomeScreen from '../screens/HomeScreen';
import ProfilScreen from '../screens/ProfilScreen';
import VaccinsScreen from '../screens/soins/VaccinsScreen';
import VermifugeScreen from '../screens/soins/VermifugeScreen';
import AutresSoinsScreen from '../screens/soins/AutresSoinsScreen';
import ConsultationScreen from '../screens/rendezvous/ConsultationScreen';
import RendezVousListScreen from '../screens/rendezvous/RendezVousListScreen';

import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Accueil" component={HomeScreen} />
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="Vaccins" component={VaccinsScreen} />
      <Stack.Screen name="Vermifuge" component={VermifugeScreen} />
      <Stack.Screen name="AutresSoins" component={AutresSoinsScreen} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} />
      <Stack.Screen name="RendezVousList" component={RendezVousListScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: 'Se connecter' }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: 'Créer un compte' }}
      />
    </Stack.Navigator>
  );
}

export default function NavigationRoot() {
  const { user, initializing } = useAuth(); // on suppose que ton AuthContext expose ça

  if (initializing) return null; // splash/loader si tu en as un

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        {/* Bannière TOP pour toutes les vues */}
        <AdBanner adUnitId={BANNER_AD_UNIT_ID} position="top" />
        {/* Pile appli ou auth selon user */}
        <View style={{ flex: 1 }}>
          {user ? <AppStack /> : <AuthStack />}
        </View>
        {/* Bannière BOTTOM pour toutes les vues */}
        <AdBanner adUnitId={BANNER_AD_UNIT_ID} position="bottom" />
      </View>
    </NavigationContainer>
  );
}
