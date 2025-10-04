// src/screens/soins/VaccinsScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAnimals } from '../../context/AnimalsContext';
import styles from '../../styles/styles'; // <- chemin corrigé
import DateField from '../../components/DateField';
import { addMonths as addMonthsFn } from '../../utils/date';

// ---------- Catalogue vaccins selon l'espèce ----------
function getVaccineCatalog(animal) {
  const type = (animal?.type || '').toLowerCase();

  if (type === 'chat') {
    // ➜ LISTES CHAT (obligatoires + optionnels)
    return {
      required: [
        { name: 'Rage', months: 12 },
        { name: 'Typhus félin (Panleucopénie)', months: 12 },
        { name: 'Coryza félin', months: 12 },
      ],
      optional: [
        { name: 'Leucose féline (FeLV)', months: 12 },
        { name: 'Chlamydiose', months: 12 },
      ],
    };
  }

  // Config Chien par défaut
  return {
    required: [
      { name: 'Carré (C)', months: 12 },
      { name: 'Hépatite de Rubarth (H)', months: 12 },
      { name: 'Parvovirose (P)', months: 12 },
      { name: 'Parainfluenza (Pi)', months: 12 },
      { name: 'Leptospirose (L)', months: 12 },
    ],
    optional: [
      { name: 'Rage (R)', months: 12 },
      { name: 'Toux de chenil (Bordetella bronchiseptica)', months: 12 },
      { name: 'Leishmaniose', months: 12 },
      { name: 'Piroplasmose (babésiose)', months: 12 },
    ],
  };
}

// Cherche l'entrée vaccin par nom (on garde la plus récente si doublon)
function findVaccinEntry(soins, nom) {
  const arr = soins.filter((s) => s.type === 'Vaccin' && s.nom === nom);
  if (arr.length === 0) return null;
  return arr.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

export default function VaccinsScreen({ route, navigation }) {
  const id = route?.params?.id;
  const { animaux, updateAnimal } = useAnimals();

  if (!id) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff' }}>
        <Text style={{ marginBottom: 12 }}>Accès invalide : identifiant animal manquant.</Text>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#eee', borderRadius: 8 }}>
          <Text>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const animal = animaux.find((a) => a.id === id);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerValid, setPickerValid] = useState(true);
  const [pickerProduit, setPickerProduit] = useState('');
  const [currentVaccin, setCurrentVaccin] = useState(null); // { name, months, mandatory }

  // Modal d'ajout de vaccin personnalisé
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addMandatory, setAddMandatory] = useState('required'); // 'required' | 'optional'
  const [customMonths, setCustomMonths] = useState('12'); // <- renommé

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  const soins = animal.soins || [];
  const catalog = useMemo(() => getVaccineCatalog(animal), [animal]);

  function openPicker(v) {
    const entry = findVaccinEntry(soins, v.name);
    setCurrentVaccin({ name: v.name, months: v.months, mandatory: v.mandatory ?? true });
    setPickerDate(entry ? new Date(entry.date) : new Date());
    setPickerProduit(entry?.produit || '');
    setPickerValid(true);
    setPickerOpen(true);
  }

  function saveVaccin(date) {
    if (!currentVaccin) return;
    const { name, months, mandatory } = currentVaccin;

    const entry = findVaccinEntry(soins, name);
    const prochain = addMonthsFn(date, months); // <- utilise la fonction

    if (entry) {
      updateAnimal(animal.id, (a) => ({
        ...a,
        soins: a.soins.map((s) =>
          s.type === 'Vaccin' && s.nom === name
            ? {
                ...s,
                date: date.toISOString(),
                rappelMois: months,
                prochain: prochain.toISOString(),
                produit: pickerProduit || null,
                obligatoire: !!mandatory,
              }
            : s
        ),
      }));
    } else {
      const newEntry = {
        id: Date.now().toString(),
        type: 'Vaccin',
        nom: name,
        date: date.toISOString(),
        rappelMois: months,
        prochain: prochain.toISOString(),
        produit: pickerProduit || null,
        obligatoire: !!mandatory, // utile pour le bouton d’état (obligatoires seulement)
      };
      updateAnimal(animal.id, (a) => ({
        ...a,
        soins: [...(a.soins || []), newEntry],
      }));
    }

    setPickerOpen(false);
    setCurrentVaccin(null);
  }

  function row(v, isMandatory) {
    const entry = findVaccinEntry(soins, v.name);
    const done = !!entry;
    const labelDate = done ? new Date(entry.date).toLocaleDateString() : 'Non fait';
    const nextDate = done
      ? (entry.prochain ? new Date(entry.prochain) : addMonthsFn(new Date(entry.date), v.months))
      : null;

    return (
      <View
        key={v.name}
        style={{
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ flex: 1, paddingRight: 12 }}>{v.name}</Text>

          <TouchableOpacity
            onPress={() => openPicker({ ...v, mandatory: isMandatory })}
            style={[styles.roundBadge, done ? styles.badgeGreen : styles.badgeRed]}
          />

          <TouchableOpacity onPress={() => openPicker({ ...v, mandatory: isMandatory })}>
            <Text
              style={{
                marginLeft: 10,
                color: done ? '#2e7d32' : '#c62828',
                fontWeight: '700',
              }}
            >
              {labelDate}
            </Text>
          </TouchableOpacity>
        </View>

        {done && (
          <>
            <Text style={{ marginTop: 6, color: '#555' }}>
              Prochain rappel:{' '}
              <Text style={{ fontWeight: '700' }}>
                {nextDate ? nextDate.toLocaleDateString() : '—'}
              </Text>
            </Text>
            {entry.produit && (
              <Text style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                Produit : {entry.produit}
              </Text>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Vaccins — {animal.nom}
        </Text>

        {/* Obligatoires */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '800', marginBottom: 6 }}>Obligatoires</Text>
          <View style={{ backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 12 }}>
            {catalog.required.map((v) => row(v, true))}
          </View>
        </View>

        {/* Optionnels */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '800', marginBottom: 6 }}>Optionnels</Text>
          <View style={{ backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 12 }}>
            {catalog.optional.map((v) => row(v, false))}
          </View>
        </View>

        {/* Ajouter un vaccin (personnalisé) */}
        <TouchableOpacity
          onPress={() => {
            setAddName('');
            setAddMandatory('required');
            setCustomMonths('12'); // <- renommé
            setAddOpen(true);
          }}
          style={[styles.btnPrimary, { marginTop: 16, alignSelf: 'flex-start' }]}
        >
          <Text style={styles.btnPrimaryText}>Ajouter un vaccin</Text>
        </TouchableOpacity>
      </View>

      {/* Modal date + produit */}
      {pickerOpen && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setPickerOpen(false)}>
          <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { flexDirection: 'column', padding: 16, width: '85%', height: undefined }]}>
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                {currentVaccin?.name}
              </Text>

              <DateField
                value={pickerDate}
                onChange={setPickerDate}
                maximumDate={new Date()}
                title="Sélectionne la date (JJ/MM/AAAA)"
                onValidityChange={setPickerValid}
              />

              <Text style={{ marginTop: 12, marginBottom: 4 }}>Nom du produit (optionnel)</Text>
              <TextInput
                value={pickerProduit}
                onChangeText={setPickerProduit}
                placeholder="ex: Nobivac, Purevax..."
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveVaccin(pickerDate)}
                  disabled={!pickerValid}
                  style={[styles.btnPrimary, !pickerValid && { opacity: 0.5 }]}
                >
                  <Text style={styles.btnPrimaryText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal ajout vaccin perso */}
      {addOpen && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setAddOpen(false)}>
          <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { flexDirection: 'column', padding: 16, width: '85%', height: undefined }]}>
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>Ajouter un vaccin</Text>

              <Text style={{ marginBottom: 6 }}>Nom du vaccin</Text>
              <TextInput
                value={addName}
                onChangeText={setAddName}
                placeholder="Nom du vaccin"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 }}
              />

              <Text style={{ marginBottom: 6 }}>Section</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => setAddMandatory('required')}
                  style={[styles.radioPill, addMandatory === 'required' && styles.radioPillActive]}
                >
                  <Text style={[styles.radioPillText, addMandatory === 'required' && styles.radioPillTextActive]}>
                    Obligatoire
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAddMandatory('optional')}
                  style={[styles.radioPill, addMandatory === 'optional' && styles.radioPillActive]}
                >
                  <Text style={[styles.radioPillText, addMandatory === 'optional' && styles.radioPillTextActive]}>
                    Optionnel
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ marginBottom: 6 }}>Rappel (en mois)</Text>
              <TextInput
                value={customMonths}
                onChangeText={(t) => setCustomMonths(String(t.replace(/\D/g, '').slice(0, 3)) || '0')}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="ex: 12"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <TouchableOpacity onPress={() => setAddOpen(false)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const name = (addName || '').trim();
                    const months = Math.max(1, parseInt(customMonths || '12', 10) || 12);
                    if (!name) {
                      Alert.alert('Nom requis', 'Merci de saisir le nom du vaccin.');
                      return;
                    }
                    openPicker({ name, months, mandatory: addMandatory === 'required' });
                    setAddOpen(false);
                  }}
                  style={styles.btnPrimary}
                >
                  <Text style={styles.btnPrimaryText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
