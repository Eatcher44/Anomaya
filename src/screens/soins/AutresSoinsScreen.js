// src/screens/soins/AutresSoinsScreen.js
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import styles from '../../styles/styles';
import { useAnimals } from '../../context/AnimalsContext';
import DateField from '../../components/DateField';
import { maskHHMM, isValidHHMM } from '../../utils/date';

function pluralDoseUnit(value, unit) {
  if (unit === 'comprimé') {
    return `${value} ${value === 1 ? 'comprimé' : 'comprimés'}`;
  }
  // mL : pas de pluriel
  return `${value} mL`;
}

export default function AutresSoinsScreen({ route }) {
  const id = route?.params?.id;
  const { animaux, updateAnimal, notif } = useAnimals();
  const animal = animaux.find((a) => a.id === id);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Champs du formulaire
  const [debut, setDebut] = useState(new Date());
  const [fin, setFin] = useState(new Date());
  const [validDebut, setValidDebut] = useState(true);
  const [validFin, setValidFin] = useState(true);

  const [nom, setNom] = useState('');
  const [doseValue, setDoseValue] = useState('');
  const [doseUnit, setDoseUnit] = useState('comprimé'); // 'comprimé' | 'ml'
  const [dosesPerDay, setDosesPerDay] = useState('1');

  // Rappels quotidiens (HH:MM)
  const [timeInput, setTimeInput] = useState('');
  const [times, setTimes] = useState([]); // ex: ["08:00","20:00"]

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  const traitements = useMemo(
    () => (animal.soins || []).filter((s) => s.type === 'Traitement'),
    [animal.soins]
  );

  const openCreate = useCallback(() => {
    setEditId(null);
    setDebut(new Date());
    setFin(new Date());
    setValidDebut(true);
    setValidFin(true);
    setNom('');
    setDoseValue('');
    setDoseUnit('comprimé');
    setDosesPerDay('1');
    setTimes([]);
    setTimeInput('');
    setOpenModal(true);
  }, []);

  const openEdit = useCallback((t) => {
    setEditId(t.id);
    setDebut(new Date(t.debut));
    setFin(new Date(t.fin));
    setValidDebut(true);
    setValidFin(true);
    setNom(t.nom || '');
    setDoseValue(String(t.doseValue ?? ''));
    setDoseUnit(t.doseUnit || 'comprimé');
    setDosesPerDay(String(t.dosesPerDay ?? '1'));
    setTimes(Array.isArray(t.times) ? t.times.slice() : []);
    setTimeInput('');
    setOpenModal(true);
  }, []);

  const addTime = useCallback(() => {
    if (!isValidHHMM(timeInput)) return;
    setTimes((prev) => {
      if (prev.includes(timeInput)) return prev;
      return [...prev, timeInput].sort();
    });
    setTimeInput('');
  }, [timeInput]);

  const removeTime = useCallback((t) => {
    setTimes((prev) => prev.filter((x) => x !== t));
  }, []);

  const scheduleForRange = useCallback(
    async (start, end, hhmmList) => {
      // Planifie chaque jour entre [start, end] pour chaque HH:MM
      const created = [];

      const day0 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const day1 = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      for (
        let d = new Date(day0);
        +d <= +day1;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      ) {
        for (const tm of hhmmList) {
          if (!isValidHHMM(tm)) continue;
          const [hh, mm] = tm.split(':').map((n) => parseInt(n, 10));
          const when = new Date(d);
          when.setHours(hh, mm, 0, 0);

          if (+when <= Date.now()) continue; // ignore passé

          const id = await notif.scheduleLocal({
            date: when,
            title: 'Rappel traitement',
            body: `${animal.nom} — ${nom} • ${pluralDoseUnit(Number(doseValue || 0), doseUnit)}`,
            data: {
              kind: 'traitement',
              animalId: animal.id,
              nom,
              dose: pluralDoseUnit(Number(doseValue || 0), doseUnit),
              dosesPerDay: Number(dosesPerDay || 1),
              at: tm,
            },
          });
          created.push(id);
        }
      }
      return created;
    },
    [animal.id, animal.nom, notif, nom, doseValue, doseUnit, dosesPerDay]
  );

  const saveTraitement = useCallback(async () => {
    // Validations
    if (!nom.trim()) {
      Alert.alert('Nom requis', 'Indique le nom du traitement.');
      return;
    }
    const dv = Number(doseValue);
    if (!(dv > 0)) {
      Alert.alert('Dose invalide', 'Indique une dose strictement positive.');
      return;
    }
    const dpd = Number(dosesPerDay);
    if (!(dpd >= 1)) {
      Alert.alert('Fréquence invalide', 'Au moins 1 dose par jour.');
      return;
    }
    if (!validDebut || !validFin) return;
    if (+debut > +fin) {
      Alert.alert('Dates invalides', 'La date de fin doit être après la date de début.');
      return;
    }

    // --- ÉDITION : annuler les anciennes notifications pour éviter les doublons
    if (editId) {
      const previous = (animal.soins || []).find((s) => s.id === editId);
      const oldIds = previous?.notifIds || [];
      for (const nid of oldIds) {
        try {
          await notif.cancel(nid);
        } catch {}
      }
    }

    // (Re)planification des rappels
    const notifIds = await scheduleForRange(debut, fin, times);

    const entry = {
      id: editId || Date.now().toString(),
      type: 'Traitement',
      nom: nom.trim(),
      doseValue: dv,
      doseUnit: doseUnit, // 'comprimé' | 'ml'
      dosesPerDay: dpd,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      times: times.slice(), // HH:MM[]
      notifIds,
    };

    updateAnimal(animal.id, (a) => {
      const others = (a.soins || []).filter((s) => s.id !== entry.id);
      return { ...a, soins: [...others, entry] };
    });

    setOpenModal(false);
  }, [
    editId,
    nom,
    doseValue,
    doseUnit,
    dosesPerDay,
    debut,
    fin,
    validDebut,
    validFin,
    times,
    scheduleForRange,
    updateAnimal,
    animal.id,
    animal.soins,
    notif,
  ]);

  const deleteTraitement = useCallback(
    (t) => {
      Alert.alert('Supprimer ce traitement ?', 'Cette action est irréversible.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            // Annule les notifs planifiées
            const ids = t.notifIds || [];
            for (const nid of ids) {
              try {
                await notif.cancel(nid);
              } catch {}
            }
            updateAnimal(animal.id, (a) => ({
              ...a,
              soins: (a.soins || []).filter((s) => s.id !== t.id),
            }));
          },
        },
      ]);
    },
    [animal.id, notif, updateAnimal]
  );

  // Liste triée : en cours d'abord, puis passés
  const now = Date.now();
  const sorted = useMemo(() => {
    const list = traitements.slice().sort((a, b) => +new Date(a.debut) - +new Date(b.debut));
    const enCours = [];
    const passes = [];
    for (const t of list) {
      const d0 = +new Date(t.debut);
      const d1 = +new Date(t.fin);
      if (d0 <= now && now <= d1) enCours.push(t);
      else passes.push(t);
    }
    return { enCours, passes };
  }, [traitements, now]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Autres soins / traitements — {animal.nom}
        </Text>

        <TouchableOpacity
          onPress={openCreate}
          style={[styles.btnPrimary, { alignSelf: 'flex-start', marginTop: 12 }]}
        >
          <Text style={styles.btnPrimaryText}>Ajouter un traitement</Text>
        </TouchableOpacity>

        {/* En cours */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>En cours</Text>
          {sorted.enCours.length === 0 ? (
            <Text style={{ marginTop: 6, color: '#666' }}>Aucun traitement en cours.</Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {sorted.enCours.map((t) => (
                <View
                  key={t.id}
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#eee',
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>{t.nom}</Text>
                  <Text style={{ marginTop: 4, color: '#555' }}>
                    Du {new Date(t.debut).toLocaleDateString()} au{' '}
                    {new Date(t.fin).toLocaleDateString()}
                  </Text>
                  <Text style={{ marginTop: 2, color: '#555' }}>
                    Dose : {pluralDoseUnit(Number(t.doseValue || 0), t.doseUnit)}
                    {'  '}•{'  '}{t.dosesPerDay} / jour
                  </Text>
                  {Array.isArray(t.times) && t.times.length > 0 && (
                    <Text style={{ marginTop: 2, color: '#555' }}>
                      Rappels : {t.times.join(', ')}
                    </Text>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      gap: 12,
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => openEdit(t)}
                      style={[styles.btnGhost, { paddingVertical: 6, paddingHorizontal: 10 }]}
                    >
                      <Text style={styles.btnGhostText}>Éditer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteTraitement(t)}
                      style={[
                        styles.btnPrimary,
                        { backgroundColor: '#e53935', paddingVertical: 6, paddingHorizontal: 10 },
                      ]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800' }}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Historique */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>Historique</Text>
          {sorted.passes.length === 0 ? (
            <Text style={{ marginTop: 6, color: '#666' }}>Aucun traitement passé.</Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {sorted.passes.map((t) => (
                <View
                  key={t.id}
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#eee',
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>{t.nom}</Text>
                  <Text style={{ marginTop: 4, color: '#555' }}>
                    Du {new Date(t.debut).toLocaleDateString()} au{' '}
                    {new Date(t.fin).toLocaleDateString()}
                  </Text>
                  <Text style={{ marginTop: 2, color: '#555' }}>
                    Dose : {pluralDoseUnit(Number(t.doseValue || 0), t.doseUnit)}
                    {'  '}•{'  '}{t.dosesPerDay} / jour
                  </Text>
                  {Array.isArray(t.times) && t.times.length > 0 && (
                    <Text style={{ marginTop: 2, color: '#555' }}>
                      Rappels : {t.times.join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* MODALE AJOUT/ÉDITION */}
      <Modal
        transparent
        animationType="fade"
        visible={openModal}
        onRequestClose={() => setOpenModal(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              { flexDirection: 'column', padding: 16, width: '90%', height: '80%' },
            ]}
          >
            <ScrollView>
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                {editId ? 'Modifier le traitement' : 'Ajouter un traitement'}
              </Text>

              {/* Dates */}
              <Text style={{ marginTop: 6, fontWeight: '600' }}>Date de début</Text>
              <DateField
                value={debut}
                onChange={setDebut}
                maximumDate={new Date(2099, 11, 31)}
                title="JJ/MM/AAAA"
                onValidityChange={setValidDebut}
              />

              <Text style={{ marginTop: 10, fontWeight: '600' }}>Date de fin</Text>
              <DateField
                value={fin}
                onChange={setFin}
                maximumDate={new Date(2099, 11, 31)}
                title="JJ/MM/AAAA"
                onValidityChange={setValidFin}
              />

              {/* Nom */}
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Nom du traitement</Text>
              <TextInput
                value={nom}
                onChangeText={setNom}
                placeholder="ex: Amoxicilline"
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 10,
                  backgroundColor: '#fff',
                }}
              />

              {/* Dose + unité exclusive */}
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Dose du traitement</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <TextInput
                  value={doseValue}
                  onChangeText={(t) => setDoseValue(t.replace(',', '.').replace(/[^0-9.]/g, ''))}
                  placeholder="ex: 2"
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 10,
                    backgroundColor: '#fff',
                  }}
                />
                <Pressable
                  onPress={() => setDoseUnit('comprimé')}
                  style={[
                    styles.radioPill,
                    doseUnit === 'comprimé' && styles.radioPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioPillText,
                      doseUnit === 'comprimé' && styles.radioPillTextActive,
                    ]}
                  >
                    Comprimé
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDoseUnit('ml')}
                  style={[styles.radioPill, doseUnit === 'ml' && styles.radioPillActive]}
                >
                  <Text
                    style={[
                      styles.radioPillText,
                      doseUnit === 'ml' && styles.radioPillTextActive,
                    ]}
                  >
                    mL
                  </Text>
                </Pressable>
              </View>

              {/* Fréquence */}
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Nombre de doses par jour</Text>
              <TextInput
                value={dosesPerDay}
                onChangeText={(t) => setDosesPerDay(t.replace(/\D/g, ''))}
                placeholder="ex: 2"
                keyboardType="number-pad"
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 10,
                  backgroundColor: '#fff',
                  marginTop: 6,
                }}
              />

              {/* Rappels quotidiens */}
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Rappels chaque jour à (optionnel)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <TextInput
                  value={timeInput}
                  onChangeText={(t) => setTimeInput(maskHHMM(t))}
                  placeholder="HH:MM"
                  keyboardType="number-pad"
                  maxLength={5}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: isValidHHMM(timeInput) || timeInput === '' ? '#ccc' : '#e53935',
                    borderRadius: 8,
                    padding: 10,
                    backgroundColor: '#fff',
                  }}
                />
                <TouchableOpacity onPress={addTime} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {times.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {times.map((t) => (
                    <View
                      key={t}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        backgroundColor: '#e9f2ff',
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#cfe0ff',
                      }}
                    >
                      <Text style={{ color: '#164C88', fontWeight: '700' }}>{t}</Text>
                      <TouchableOpacity onPress={() => removeTime(t)}>
                        <Text style={{ color: '#164C88', fontWeight: '900' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
                <TouchableOpacity onPress={() => setOpenModal(false)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveTraitement} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>{editId ? 'Enregistrer' : 'Valider'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
