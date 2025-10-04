// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, [initializing]);

  // Création de compte email + mot de passe
  const signUpWithEmail = async (email, password, username) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (username) await updateProfile(cred.user, { displayName: username });

    const profileRef = doc(db, 'users', cred.user.uid, 'meta', 'profile');
    await setDoc(
      profileRef,
      {
        displayName: username || '',
        email: cred.user.email,
        provider: 'password',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return cred.user;
  };

  // Connexion email + mot de passe
  const signInWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Connexion Google via idToken (expo-auth-session)
  const signInWithGoogleIdToken = async (idToken) => {
    console.log('[Auth] idToken present =', typeof idToken === 'string' && idToken.length > 10);
    console.log('[Auth] GoogleAuthProvider.credential type =', typeof GoogleAuthProvider?.credential);

    if (typeof GoogleAuthProvider?.credential !== 'function') {
      throw new Error(
        'GoogleAuthProvider.credential indisponible. Assure-toi d’utiliser le SDK Web "firebase/auth" et que l’update est appliquée.'
      );
    }

    const credential = GoogleAuthProvider.credential(idToken); // ✅ Web SDK (statique)
    const res = await signInWithCredential(auth, credential);
    const u = res.user;

    // Crée/merge un profil Firestore minimal
    const profileRef = doc(db, 'users', u.uid, 'meta', 'profile');
    await setDoc(
      profileRef,
      {
        displayName: u.displayName || '',
        email: u.email || '',
        photoURL: u.photoURL || '',
        provider: 'google',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return u;
  };

  const signOut = () => fbSignOut(auth);

  const value = useMemo(
    () => ({
      user,
      initializing,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogleIdToken,
      signOut,
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
