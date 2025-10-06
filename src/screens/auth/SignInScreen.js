// SignInScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '572516947130-7cl0hf0hdiav326sls62ai1srn9mv90n.apps.googleusercontent.com'; 
// ⚠️ C'est le "Client ID" de type Web depuis Google Cloud Console (écran OAuth > Identifiants).
// Ce n'est PAS l'Android client ID. Le SDK google-signin côté RN attend le webClientId pour extraire un idToken compatible Firebase.

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);

  // Configure Google Sign-In une seule fois
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  const onGooglePress = useCallback(async () => {
    try {
      setLoading(true);

      // Vérifie Google Play Services (indispensable en prod Play Store)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Lance le flux Google natif
      const { idToken } = await GoogleSignin.signIn();
      if (!idToken) {
        throw new Error('Pas de idToken retourné par Google.');
      }

      // Crée la cred Firebase à partir du idToken Google
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Connecte l’utilisateur à Firebase
      await auth().signInWithCredential(googleCredential);

      // Optionnel: ici tu peux naviguer vers l’écran Home…
      // navigation.replace('Home');
    } catch (e) {
      // Gestion fine des erreurs courantes
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        // L’utilisateur a annulé — ne rien afficher d’alarmant
        return;
      }
      if (e?.code === statusCodes.IN_PROGRESS) {
        // Un flux est déjà en cours
        return;
      }
      if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Mise à jour requise', 'Google Play Services n’est pas disponible ou doit être mis à jour.');
        return;
      }

      // Autres erreurs (y compris config/OAuth/clé SHA manquante)
      console.log('Google sign-in error:', e);
      Alert.alert('Connexion Google', e?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TouchableOpacity
        onPress={onGooglePress}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Continuer avec Google</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        Assurez-vous d’avoir bien configuré l’ID client Web et les empreintes SHA dans Firebase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { marginTop: 16, fontSize: 12, color: '#666', textAlign: 'center' },
});
