// src/screens/auth/SignUpScreen.js
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

function normalizeEmail(v) { return v.trim().toLowerCase(); }
function isValidEmail(e) { return /^\S+@\S+\.\S+$/.test(e); }
function firebaseErrorToMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use': return "Cet e-mail est déjà utilisé.";
    case 'auth/invalid-email': return "L'e-mail est invalide.";
    case 'auth/weak-password': return 'Mot de passe trop faible (6 caractères minimum).';
    case 'auth/network-request-failed': return 'Problème de réseau. Vérifie ta connexion.';
    case 'auth/too-many-requests': return "Trop de tentatives. Réessaie plus tard.";
    case 'auth/operation-not-allowed': return "Méthode d'inscription désactivée côté Firebase.";
    default: return "Impossible de créer le compte pour l’instant.";
  }
}

export default function SignUpScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(async () => {
    const u = username.trim();
    const e = normalizeEmail(email);
    const p = pwd;

    if (!u) { Alert.alert('Nom d’utilisateur requis', 'Merci de renseigner un nom d’utilisateur.'); return; }
    if (!e || !isValidEmail(e)) { Alert.alert('E-mail invalide', 'Merci de renseigner un e-mail valide.'); return; }
    if (!p || p.length < 6) { Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.'); return; }

    try {
      setBusy(true);
      const cred = await auth().createUserWithEmailAndPassword(e, p);

      // Met à jour le displayName avec le username
      if (cred?.user) {
        await cred.user.updateProfile({ displayName: u }).catch(() => {});
        try { await cred.user.sendEmailVerification(); } catch {}
      }

      Alert.alert('Compte créé', 'Bienvenue ! Vérifie tes e-mails pour confirmer ton adresse.');
      // App.js (onAuthStateChanged) basculera automatiquement vers Home
    } catch (err) {
      console.warn('SignUp error:', err);
      Alert.alert('Erreur', firebaseErrorToMessage(err?.code));
    } finally {
      setBusy(false);
    }
  }, [username, email, pwd]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>Créer un compte</Text>
        <Text style={{ textAlign: 'center', color: '#555', marginBottom: 16 }}>
          Accède à tes données sur n’importe quel appareil.
        </Text>

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ marginBottom: 6, fontWeight: '600' }}>Nom d’utilisateur</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="ex: minette_lover"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, backgroundColor: '#fff' }}
            />
          </View>

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
              placeholder="Minimum 6 caractères"
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
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Créer mon compte</Text>}
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <TouchableOpacity onPress={() => navigation.replace('SignIn')} activeOpacity={0.8}>
              <Text style={{ color: '#007bff' }}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
