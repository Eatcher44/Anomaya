// src/navigation/index.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import ProfilScreen from '../screens/ProfilScreen';
import PoidsScreen from '../screens/PoidsScreen';

import SoinsHub from '../screens/soins/SoinsHub';
import VaccinsScreen from '../screens/soins/VaccinsScreen';
import VermifugeScreen from '../screens/soins/VermifugeScreen';
import AutresSoinsScreen from '../screens/soins/AutresSoinsScreen';

import RendezVousListScreen from '../screens/rendezvous/RendezVousListScreen';
import ConsultationScreen from '../screens/rendezvous/ConsultationScreen';

import SignInScreen from '../screens/auth/SignInScreen';

import { useAuth } from '../context/AuthContext';
import AdBanner from '../ads/AdBanner';

const Stack = createStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Accueil" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profil" component={ProfilScreen} options={{ title: 'Profil' }} />
      <Stack.Screen name="Poids" component={PoidsScreen} options={{ title: 'Poids' }} />

      <Stack.Screen name="SoinsHub" component={SoinsHub} options={{ title: 'Soins' }} />
      <Stack.Screen name="Vaccins" component={VaccinsScreen} options={{ title: 'Vaccins' }} />
      <Stack.Screen name="Vermifuge" component={VermifugeScreen} options={{ title: 'Anti-puce & Vermifuge' }} />
      <Stack.Screen
        name="AutresSoins"
        component={AutresSoinsScreen}
        options={{ title: 'Autres soins / traitements' }}
      />

      <Stack.Screen
        name="RendezVousList"
        component={RendezVousListScreen}
        options={{ title: 'Rendez-vous' }}
      />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: 'Consultation' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AuthFlow() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}

export default function Navigation() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <AdBanner position="top" />
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <AuthFlow />
        </NavigationContainer>
      </View>
      <AdBanner position="bottom" />
    </View>
  );
}
