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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/styles';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(async () => {
    const u = username.trim();
    const e = email.trim().toLowerCase();
    const p = pwd;

    if (!u) {
      Alert.alert('Nom d’utilisateur requis', 'Merci de renseigner un nom d’utilisateur.');
      return;
    }
    if (!e || !/^\S+@\S+\.\S+$/.test(e)) {
      Alert.alert('E-mail invalide', 'Merci de renseigner un e-mail valide.');
      return;
    }
    if (!p || p.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.');
      return;
    }

    try {
      setBusy(true);
      await signUp({ username: u, email: e, password: p });
      // Le passage à l’espace connecté sera géré par AuthProvider (user non-null)
    } catch (err) {
      console.warn('SignUp error:', err);
      Alert.alert('Erreur', "Impossible de créer le compte pour l’instant.");
    } finally {
      setBusy(false);
    }
  }, [username, email, pwd, signUp]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { justifyContent: 'center' }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView
        contentContainerStyle={{ paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.titre, { marginBottom: 6 }]}>Créer un compte</Text>
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
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 10,
                padding: 12,
                backgroundColor: '#fff',
              }}
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
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 10,
                padding: 12,
                backgroundColor: '#fff',
              }}
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
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 10,
                padding: 12,
                backgroundColor: '#fff',
              }}
            />
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={busy}
            style={[
              styles.btnPrimary,
              { marginTop: 8, alignItems: 'center' },
              busy && { opacity: 0.6 },
            ]}
            activeOpacity={0.9}
          >
            <Text style={styles.btnPrimaryText}>
              {busy ? 'Création…' : 'Créer mon compte'}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <TouchableOpacity
              onPress={() => navigation.replace('SignIn')}
              activeOpacity={0.8}
              style={styles.btnGhost}
            >
              <Text style={styles.btnGhostText}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
