// src/services/firebase.js
// Initialisation Firebase pour React Native (Expo)
// - Auth persistée via AsyncStorage
// - Firestore configuré pour RN

import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Garde ces valeurs synchronisées avec la console Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyD4Y7nc1t2XLicoTlns9zaQ1AFISehQ_ac',
  authDomain: 'anonamya.firebaseapp.com',
  projectId: 'anonamya',
  storageBucket: 'anonamya.firebasestorage.app',
  messagingSenderId: '572516947130',
  appId: '1:572516947130:web:37462f1ed4d270d0529e83',
  measurementId: 'G-XTTR8B91VD',
};

const app = initializeApp(firebaseConfig);

// --- Auth (persistance RN) ---
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --- Firestore (réglages RN pour réseaux/proxy) ---
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export default app;
