// src/context/AnimalsContext.js
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';

const AnimalsContext = createContext(null);

/**
 * Helpers Notifications (Expo)
 */
async function ensureNotifPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: s2 } = await Notifications.requestPermissionsAsync();
    return s2 === 'granted';
  }
  return true;
}

async function scheduleLocal({ date, title, body, data }) {
  const ok = await ensureNotifPermission();
  if (!ok) throw new Error('Notification permission denied');
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data || {} },
    trigger: date, // Date object
  });
  return id;
}

/**
 * Provider
 */
export function AnimalsProvider({ children }) {
  const { user } = useAuth();
  const [animaux, setAnimauxState] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const animauxRef = useRef(animaux);
  const rdvRef = useRef(rendezvous);

  useEffect(() => { animauxRef.current = animaux; }, [animaux]);
  useEffect(() => { rdvRef.current = rendezvous; }, [rendezvous]);

  // Abonnements Firestore par utilisateur
  useEffect(() => {
    if (!user) {
      setAnimauxState([]);
      setRendezvous([]);
      return;
    }

    const animalsCol = collection(db, 'users', user.uid, 'animals');
    const qAnimals = query(animalsCol, orderBy('createdAt', 'asc'));
    const unsubAnimals = onSnapshot(qAnimals, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setAnimauxState(list);
    });

    const rdvCol = collection(db, 'users', user.uid, 'rendezvous');
    const qRdv = query(rdvCol, orderBy('date', 'asc'));
    const unsubRdv = onSnapshot(qRdv, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setRendezvous(list);
    });

    return () => {
      unsubAnimals();
      unsubRdv();
    };
  }, [user]);

  // ----- Animaux -----
  const addAnimal = async (animal) => {
    if (!user) throw new Error('Not authenticated');
    const id = animal.id || String(Date.now());
    const ref = doc(db, 'users', user.uid, 'animals', id);
    await setDoc(ref, {
      ...animal,
      id, // redondant mais pratique pour les écrans
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return id;
  };

  // signature compatible avec tes écrans : updateAnimal(id, mutatorFn)
  const updateAnimal = async (id, mutator) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(db, 'users', user.uid, 'animals', id);
    const snap = await getDoc(ref);
    const before = snap.exists() ? { id, ...snap.data() } : null;
    const next = typeof mutator === 'function' ? mutator(before || {}) : mutator;
    await setDoc(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });
  };

  const deleteAnimal = async (id) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(db, 'users', user.uid, 'animals', id);
    await deleteDoc(ref);
    // (Optionnel) Nettoyer les RDV qui ne référencent plus cet animal
    // À toi de voir si tu veux faire ce ménage ici.
  };

  /**
   * Compatibilité : dans ton HomeScreen actuel, tu fais setAnimaux(prev => [...prev, newAnimal]).
   * Cette implémentation intercepte ce cas courant et le transforme en addAnimal(newAnimal).
   * Pour toute autre opération, on loggue un warning (on ne remplace pas la collection entière côté Firestore).
   */
  const setAnimaux = async (updater) => {
    if (typeof updater === 'function') {
      const prev = animauxRef.current;
      const next = updater(prev);
      if (Array.isArray(next) && next.length === prev.length + 1) {
        // on tente de trouver l’élément ajouté
        const added = next.find(n => !prev.some(p => p.id === n.id));
        if (added) {
          return addAnimal(added);
        }
      }
      console.warn('[AnimalsContext] setAnimaux: opération non supportée en mode Firestore. Utilise addAnimal/updateAnimal/deleteAnimal.');
      return;
    }
    console.warn('[AnimalsContext] setAnimaux: assignation directe non supportée.');
  };

  // ----- Rendez-vous -----
  const addRendezVous = async (rdv) => {
    if (!user) throw new Error('Not authenticated');
    const id = rdv.id || String(Date.now());
    const ref = doc(db, 'users', user.uid, 'rendezvous', id);
    await setDoc(ref, {
      ...rdv,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return id;
  };

  const updateRdv = async (id, mutator) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(db, 'users', user.uid, 'rendezvous', id);
    const snap = await getDoc(ref);
    const before = snap.exists() ? { id, ...snap.data() } : null;
    const next = typeof mutator === 'function' ? mutator(before || {}) : mutator;
    await setDoc(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });
  };

  const deleteRdv = async (id) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(db, 'users', user.uid, 'rendezvous', id);
    await deleteDoc(ref);
  };

  const value = useMemo(() => ({
    // data
    animaux,
    rendezvous,

    // animaux
    setAnimaux,          // compat HomeScreen (append)
    addAnimal,
    updateAnimal,
    deleteAnimal,

    // rdv
    addRendezVous,
    updateRdv,
    deleteRdv,

    // notifications wrapper (compatible avec ton HomeScreen)
    notif: { scheduleLocal },
  }), [animaux, rendezvous]);

  return <AnimalsContext.Provider value={value}>{children}</AnimalsContext.Provider>;
}

export const useAnimals = () => useContext(AnimalsContext);
