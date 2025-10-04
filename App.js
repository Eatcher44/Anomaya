// App.js
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Écrans
import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen'; // adapte si besoin

// OTA logs
import { useLogUpdates } from './src/utils/useLogUpdates';

const Stack = createNativeStackNavigator();

export default function App() {
  useLogUpdates();

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Connexion' }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Créer un compte' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
