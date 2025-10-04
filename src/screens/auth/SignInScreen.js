// src/screens/auth/SignInScreen.js
import React, { useRef, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import styles from '../../styles/styles';
import { useAuth } from '../../context/AuthContext';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  '572516947130-7cl0hf0hdiav326sls62ai1srn9mv90n.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

import GoogleG from '../../../assets/google-g.png';

export default function SignInScreen({ navigation }) {
  const { signInWithEmail, signInWithGoogleIdToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleBusyRef = useRef(false);

  async function onEmailLogin() {
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      Alert.alert('Connexion', e?.message || 'Impossible de se connecter.');
    }
  }

  async function onGoogle() {
    if (googleBusyRef.current) return;
    googleBusyRef.current = true;

    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const nonce = Math.random().toString(36).slice(2);
      const scope = encodeURIComponent('openid profile email');

      const authUrl =
        `${discovery.authorizationEndpoint}` +
        `?client_id=${encodeURIComponent(WEB_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${scope}` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&prompt=select_account`;

      const result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });

      console.log('[Google AuthSession]', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        const idToken = result.params?.id_token;
        if (!idToken) throw new Error('Aucun id_token reçu depuis Google.');
        await signInWithGoogleIdToken(idToken);
      } else if (result.type === 'dismiss') {
        // L’utilisateur a fermé la webview
      } else {
        const msg =
          result.params?.error_description ||
          result.params?.error ||
          result.error ||
          'Échec Google';
        throw new Error(msg);
      }
    } catch (e) {
      Alert.alert('Google', e?.message || 'Connexion Google indisponible.');
    } finally {
      googleBusyRef.current = false;
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: 40 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[styles.titre, { marginBottom: 24 }]}>Bienvenue</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 10,
          padding: 12,
          backgroundColor: '#fff',
          marginBottom: 10,
        }}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 10,
          padding: 12,
          backgroundColor: '#fff',
        }}
      />

      {/* Connexion email */}
      <TouchableOpacity
        onPress={onEmailLogin}
        style={[styles.btnPrimary, { marginTop: 12 }]}
        activeOpacity={0.9}
      >
        <Text style={styles.btnPrimaryText}>Se connecter</Text>
      </TouchableOpacity>

      {/* Bouton Google */}
      <TouchableOpacity
        onPress={onGoogle}
        activeOpacity={0.9}
        style={{
          marginTop: 10,
          height: 48,
          borderRadius: 12,
          backgroundColor: '#DB4437',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: 14,
        }}
      >
        <Image
          source={GoogleG}
          style={{ width: 20, height: 20, marginRight: 10 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
          Continuer avec Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('SignUp')}
        style={{ alignSelf: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#164C88', fontWeight: '700' }}>Créer un compte</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
