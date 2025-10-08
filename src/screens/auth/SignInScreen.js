// src/screens/auth/SignInScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';

function isValidEmail(e) {
  return /^\S+@\S+\.\S+$/.test(e);
}

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(async () => {
    const e = email.trim().toLowerCase();
    const p = pwd;

    if (!e || !isValidEmail(e)) {
      Alert.alert('E-mail invalide', 'Merci de renseigner un e-mail valide.');
      return;
    }
    if (!p) {
      Alert.alert('Mot de passe requis', 'Merci de renseigner un mot de passe.');
      return;
    }

    try {
      setBusy(true);
      await auth().signInWithEmailAndPassword(e, p);
      // onAuthStateChanged dans App.js basculera vers Home automatiquement
    } catch (err) {
      console.warn('SignIn error:', err);
      let msg = "Impossible de se connecter.";
      switch (err?.code) {
        case 'auth/invalid-email': msg = "L'e-mail est invalide."; break;
        case 'auth/user-not-found':
        case 'auth/wrong-password': msg = "Identifiants incorrects."; break;
        case 'auth/too-many-requests': msg = "Trop de tentatives, réessayez plus tard."; break;
        case 'auth/network-request-failed': msg = "Problème de réseau."; break;
      }
      Alert.alert('Erreur', msg);
    } finally {
      setBusy(false);
    }
  }, [email, pwd]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>Connexion</Text>
        <Text style={{ textAlign: 'center', color: '#555', marginBottom: 16 }}>
          Accède à tes données sur n’importe quel appareil.
        </Text>

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ marginBottom: 6, fontWeight: '600' }}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ex: toi@mail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              textContentType="emailAddress"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, backgroundColor: '#fff' }}
            />
          </View>

          <View>
            <Text style={{ marginBottom: 6, fontWeight: '600' }}>Mot de passe</Text>
            <TextInput
              value={pwd}
              onChangeText={setPwd}
              placeholder="Ton mot de passe"
              secureTextEntry
              textContentType="password"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, backgroundColor: '#fff' }}
            />
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={busy}
            style={[
              { backgroundColor: '#000', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
              busy && { opacity: 0.6 },
            ]}
            activeOpacity={0.9}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Se connecter</Text>}
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <TouchableOpacity onPress={() => navigation.replace('SignUp')} activeOpacity={0.8}>
              <Text style={{ color: '#007bff' }}>Pas de compte ? Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
