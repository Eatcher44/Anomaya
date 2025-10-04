// src/screens/soins/VermifugeScreen.js
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useAnimals } from '../../context/AnimalsContext';
import DateField from '../../components/DateField';
import styles from '../../styles/styles';

/* ---------------------- ANTI-PUCE & VERMIFUGE ---------------------- */
export default function VermifugeScreen({ route }) {
  const { id } = route.params;
  const { animaux, updateAnimal } = useAnimals();
  const animal = animaux.find((a) => a.id === id);

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  const birth = new Date(animal.naissance);
  const today = new Date();

  // Helpers date
  const addMonths = (d, m) => {
    const nd = new Date(d);
    nd.setMonth(nd.getMonth() + m);
    return nd;
  };
  const addWeeks = (d, w) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + 7 * w);
    return nd;
  };
  const diffDays = (a, b) => Math.floor((+a - +b) / 86400000);
  const ageInWeeksAt = (date) => Math.floor((+date - +birth) / 86400000 / 7);
  const ageInMonthsAt = (date) => {
    const d = new Date(date);
    let m =
      (d.getFullYear() - birth.getFullYear()) * 12 +
      (d.getMonth() - birth.getMonth());
    if (d.getDate() < birth.getDate()) m -= 1;
    return m;
  };

  const soins = animal.soins || [];
  const listByType = (type) =>
    soins
      .filter((s) => s.type === type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastOfType = (type) => listByType(type)[0] || null;

  // ---- Anti-puce ----
  const lastAnti = lastOfType('Antipuce');
  const lastAntiDate = lastAnti ? new Date(lastAnti.date) : null;
  const firstAntiAt = addWeeks(birth, 8);

  const nextAntiDue = React.useMemo(() => {
    if (lastAntiDate) return addMonths(lastAntiDate, 3); // tous les 3 mois (indicatif)
    const ageWeeks = ageInWeeksAt(today);
    return ageWeeks < 8 ? firstAntiAt : today;
  }, [lastAntiDate, firstAntiAt, today]);

  const antiDays = diffDays(nextAntiDue, today);
  const antiStatus = antiDays < 0 ? 'red' : antiDays <= 7 ? 'orange' : 'green';

  // ---- Vermifuge ----
  const lastVermi = lastOfType('Vermifuge');
  const lastVermiDate = lastVermi ? new Date(lastVermi.date) : null;

  function nextVermiDue() {
    if (lastVermiDate) {
      // < 6 mois : tous les mois, sinon tous les 3 mois (indicatif)
      const candidate1 = addMonths(lastVermiDate, 1);
      const ageM = ageInMonthsAt(candidate1);
      return ageM <= 6 ? candidate1 : addMonths(lastVermiDate, 3);
    }
    // protocole chiot/chaton : 3, 5, 7 semaines
    const ageW = ageInWeeksAt(today);
    if (ageW <= 7) {
      const infant = [3, 5, 7]
        .map((w) => addWeeks(birth, w))
        .filter((d) => d > today);
      if (infant.length > 0) return infant[0];
    }
    return today;
  }

  const nextVermi = nextVermiDue();
  const vermiDays = diffDays(nextVermi, today);
  const vermiStatus = vermiDays < 0 ? 'red' : vermiDays <= 7 ? 'orange' : 'green';

  // Picker commun
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState(null); // 'antipuce' | 'vermifuge'
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerValid, setPickerValid] = useState(true);
  const [pickerProduit, setPickerProduit] = useState('');

  function openPickerFor(mode) {
    setPickerMode(mode);
    if (mode === 'antipuce')
      setPickerDate(
        lastAntiDate || (ageInWeeksAt(today) < 8 ? firstAntiAt : today)
      );
    else setPickerDate(lastVermiDate || today);
    setPickerValid(true);
    setPickerProduit('');
    setPickerOpen(true);
  }

  function savePickedDate(date) {
    const entry = {
      id: Date.now().toString(),
      type: pickerMode === 'antipuce' ? 'Antipuce' : 'Vermifuge',
      nom: pickerMode === 'antipuce' ? 'Anti-puce' : 'Vermifuge',
      produit: pickerProduit || null,
      date: date.toISOString(),
    };
    updateAnimal(animal.id, (a) => ({
      ...a,
      soins: [...(a.soins || []), entry],
    }));
    setPickerOpen(false);
    setPickerMode(null);
  }

  const badgeStyleFor = (status) => [
    styles.roundBadge,
    status === 'red'
      ? styles.badgeRed
      : status === 'orange'
      ? styles.badgeOrange
      : styles.badgeGreen,
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Anti-puce & Vermifuge — {animal.nom}
        </Text>

        {/* Anti-puce */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: '#FAFAFA',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#eee',
            padding: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Anti-puce</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={badgeStyleFor(antiStatus)} />
              <TouchableOpacity onPress={() => openPickerFor('antipuce')} style={styles.dateRect}>
                <Text style={styles.dateRectText}>
                  Dernière : {lastAntiDate ? lastAntiDate.toLocaleDateString() : 'choisir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {lastAnti && lastAnti.produit && (
            <Text style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
              Produit : {lastAnti.produit}
            </Text>
          )}
          <Text style={{ marginTop: 8, color: '#555' }}>
            Prochain : <Text style={{ fontWeight: '700' }}>{nextAntiDue.toLocaleDateString()}</Text>
          </Text>
        </View>

        {/* Vermifuge */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: '#FAFAFA',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#eee',
            padding: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Vermifuge</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={badgeStyleFor(vermiStatus)} />
              <TouchableOpacity onPress={() => openPickerFor('vermifuge')} style={styles.dateRect}>
                <Text style={styles.dateRectText}>
                  Dernière : {lastVermiDate ? lastVermiDate.toLocaleDateString() : 'choisir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {lastVermi && lastVermi.produit && (
            <Text style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
              Produit : {lastVermi.produit}
            </Text>
          )}
          <Text style={{ marginTop: 8, color: '#555' }}>
            Prochain : <Text style={{ fontWeight: '700' }}>{nextVermi.toLocaleDateString()}</Text>
          </Text>
        </View>
      </View>

      {/* Modale commune */}
      {pickerOpen && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setPickerOpen(false)}
        >
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContainer,
                {
                  flexDirection: 'column',
                  padding: 16,
                  width: '85%',
                  height: undefined,
                },
              ]}
            >
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                {pickerMode === 'antipuce' ? 'Date — Anti-puce' : 'Date — Vermifuge'}
              </Text>

              <DateField
                value={pickerDate}
                onChange={setPickerDate}
                maximumDate={new Date()}
                title="Sélectionne la date (JJ/MM/AAAA)"
                onValidityChange={setPickerValid}
              />

              <Text style={{ marginTop: 12, marginBottom: 4 }}>
                Nom du produit (optionnel)
              </Text>
              <TextInput
                value={pickerProduit}
                onChangeText={setPickerProduit}
                placeholder="ex: Frontline, Milbemax..."
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 10,
                  backgroundColor: '#fff',
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setPickerOpen(false)}
                  style={styles.btnGhost}
                >
                  <Text style={styles.btnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => savePickedDate(pickerDate)}
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
    </ScrollView>
  );
}
