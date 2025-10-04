// src/screens/HomeScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import styles from '../styles/styles';
import { useAnimals } from '../context/AnimalsContext';
import DateField from '../components/DateField';
import AnimalRow from '../components/AnimalRow';
import { maskHHMM, isValidHHMM, addMonths, addWeeks, diffDays } from '../utils/date';
import { catBreeds, dogBreeds } from '../utils/breeds';
import chatImage from '../../assets/chat.png';
import chienImage from '../../assets/chien.png';

// Interstitiel
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { INTERSTITIAL_AD_UNIT_ID } from '../ads/adIds';

/* ---------------------- Vaccins — catalogue par espèce ---------------------- */
function getVaccineCatalogFor(type) {
  const t = (type || '').toLowerCase();
  if (t === 'chat') {
    return {
      mandatory: ['Rage', 'Typhus félin (Panleucopénie)', 'Coryza félin'],
      optional: ['Leucose féline (FeLV)', 'Chlamydiose'],
      defaultMonths: 12,
    };
  }
  if (t === 'chien') {
    return {
      mandatory: [
        'Carré (C)',
        'Hépatite de Rubarth (H)',
        'Parvovirose (P)',
        'Parainfluenza (Pi)',
        'Leptospirose (L)',
      ],
      optional: ['Rage (R)', 'Toux de chenil (Bordetella bronchiseptica)', 'Leishmaniose', 'Piroplasmose (babésiose)'],
      defaultMonths: 12,
    };
  }
  return { mandatory: [], optional: [], defaultMonths: 12 };
}

/* ---------------------- Helpers ---------------------- */
const lastPoidsKg = (a) => {
  if (!a.poids || a.poids.length === 0) return null;
  const last = [...a.poids].sort((x, y) => new Date(y.date) - new Date(x.date))[0];
  return last?.poids ?? null;
};

// Calcule le statut santé (feu tricolore) + la liste des items non verts
function computeHealth(animal) {
  const now = new Date();
  const soins = Array.isArray(animal.soins) ? animal.soins : [];
  const { mandatory, defaultMonths } = getVaccineCatalogFor(animal.type);

  const issues = [];

  // Vaccins obligatoires
  for (const name of mandatory) {
    const entries = soins
      .filter((s) => s.type === 'Vaccin' && s.nom === name && s.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    let status = 'red';
    let due = null;

    if (entries.length > 0) {
      const last = entries[0];
      const months = Number.isFinite(last.rappelMois) ? last.rappelMois : defaultMonths;
      const lastDate = new Date(last.date);
      due = addMonths(lastDate, months);
      const d = diffDays(due, now);
      if (d < 0) status = 'red';
      else if (d <= 7) status = 'orange';
      else status = 'green';
    } else {
      status = 'red';
    }

    if (status !== 'green') {
      issues.push({
        kind: 'vaccin',
        name,
        status,
        dueDate: due,
        goto: { screen: 'Vaccins', params: { id: animal.id } },
      });
    }
  }

  // Anti-puce
  const birth = new Date(animal.naissance);
  const lastAnti = soins
    .filter((s) => s.type === 'Antipuce' && s.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

  const firstAntiAt = addWeeks(birth, 8);
  const nextAntiDue = lastAnti
    ? addMonths(new Date(lastAnti.date), 3)
    : (() => {
        const ageW = Math.floor((+now - +birth) / 86400000 / 7);
        return ageW < 8 ? firstAntiAt : now;
      })();
  const antiDays = diffDays(nextAntiDue, now);
  const antiStatus = antiDays < 0 ? 'red' : antiDays <= 7 ? 'orange' : 'green';
  if (antiStatus !== 'green') {
    issues.push({
      kind: 'antipuce',
      name: 'Anti-puce',
      status: antiStatus,
      dueDate: nextAntiDue,
      goto: { screen: 'Vermifuge', params: { id: animal.id } },
    });
  }

  // Vermifuge
  const lastVermi = soins
    .filter((s) => s.type === 'Vermifuge' && s.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

  function nextVermiDue() {
    if (lastVermi) {
      const lastDate = new Date(lastVermi.date);
      const candidate1 = addMonths(lastDate, 1);
      const d = new Date(candidate1);
      let m = (d.getFullYear() - birth.getFullYear()) * 12 + (d.getMonth() - birth.getMonth());
      if (d.getDate() < birth.getDate()) m -= 1;
      return m <= 6 ? candidate1 : addMonths(lastDate, 3);
    }
    const ageW = Math.floor((+now - +birth) / 86400000 / 7);
    if (ageW <= 7) {
      const infant = [3, 5, 7]
        .map((w) => addWeeks(birth, w))
        .filter((d) => d > now);
      if (infant.length > 0) return infant[0];
    }
    return now;
  }
  const vermiDue = nextVermiDue();
  const vermiDays = diffDays(vermiDue, now);
  const vermiStatus = vermiDays < 0 ? 'red' : vermiDays <= 7 ? 'orange' : 'green';
  if (vermiStatus !== 'green') {
    issues.push({
      kind: 'vermifuge',
      name: 'Vermifuge',
      status: vermiStatus,
      dueDate: vermiDue,
      goto: { screen: 'Vermifuge', params: { id: animal.id } },
    });
  }

  const hasRed = issues.some((i) => i.status === 'red');
  const hasOrange = issues.some((i) => i.status === 'orange');
  const color = hasRed ? 'red' : hasOrange ? 'orange' : 'green';

  return { color, issues };
}

/* ---------------------- Écran ---------------------- */
export default function HomeScreen({ navigation }) {
  const {
    animaux,
    setAnimaux,
    updateAnimal,
    deleteAnimal,
    rendezvous,
    addRendezVous,
    updateRdv,
    notif,
  } = useAnimals();

  // Interstitiel (préchargé)
  const {
    isLoaded: interReady,
    load: interLoad,
    show: interShow,
  } = useInterstitialAd(INTERSTITIAL_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => {
    interLoad();
  }, [interLoad]);

  // Tri bottom sheet
  const [triVisible, setTriVisible] = useState(false);
  const [triSelected, setTriSelected] = useState('alpha');

  // Ajout (flux)
  const [modalNomVisible, setModalNomVisible] = useState(false);
  const [nomSaisi, setNomSaisi] = useState('');
  const [modalTypeVisible, setModalTypeVisible] = useState(false);
  const [modalSexeVisible, setModalSexeVisible] = useState(false);
  const [modalRaceVisible, setModalRaceVisible] = useState(false);
  const [modalDateVisible, setModalDateVisible] = useState(false);
  const [modalSterilVisible, setModalSterilVisible] = useState(false);

  const [modalCustomTypeVisible, setModalCustomTypeVisible] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [customTypeRaceInput, setCustomTypeRaceInput] = useState('');

  const [modalCustomRaceVisible, setModalCustomRaceVisible] = useState(false);
  const [customRaceInput, setCustomRaceInput] = useState('');

  const [animalTemp, setAnimalTemp] = useState('');
  const [typeTemp, setTypeTemp] = useState('');
  const [sexeTemp, setSexeTemp] = useState('');
  const [raceTemp, setRaceTemp] = useState('—');
  const [dateTemp, setDateTemp] = useState(new Date());
  const [sterilTemp, setSterilTemp] = useState(false);
  const [birthValid, setBirthValid] = useState(true);

  // RDV
  const [rdvOpen, setRdvOpen] = useState(false);
  const [rdvDate, setRdvDate] = useState(new Date());
  const [rdvDateValid, setRdvDateValid] = useState(true);
  const [rdvHeure, setRdvHeure] = useState('');
  const [rdvLieu, setRdvLieu] = useState('');
  const [rdvSelectedIds, setRdvSelectedIds] = useState(() => new Set());

  const [rdvNotifOpen, setRdvNotifOpen] = useState(false);
  const [notifOptions, setNotifOptions] = useState(new Set(['24hVeille20h', '2h']));
  const [customNotifOpen, setCustomNotifOpen] = useState(false);
  const [customNotifValue, setCustomNotifValue] = useState('');

  const dogBreedOptions = [...dogBreeds, 'Autre'];
  const catBreedOptions = [...catBreeds, 'Autre'];

  // Photo picker
  const choisirPhoto = useCallback(async (id) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission refusée', 'Autorise l’accès aux photos pour ajouter une image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        updateAnimal(id, (a) => ({ ...a, photo: result.assets[0].uri }));
      }
    } catch (e) {
      console.warn('ImagePicker error:', e);
      Alert.alert('Erreur', 'Impossible d’ouvrir la galerie. Réessaie.');
    }
  }, [updateAnimal]);

  // Flux d'ajout
  const demarrerAjoutAnimal = useCallback(() => {
    setNomSaisi('');
    setTypeTemp('');
    setRaceTemp('—');
    setSexeTemp('');
    setCustomTypeInput('');
    setCustomTypeRaceInput('');
    setCustomRaceInput('');
    setModalNomVisible(true);
  }, []);

  const validerNomEtContinuer = useCallback(() => {
    const n = (nomSaisi || '').trim();
    if (!n) { Alert.alert('Nom requis', 'Merci de saisir le nom de l’animal.'); return; }
    setAnimalTemp(n); setModalNomVisible(false); setModalTypeVisible(true);
  }, [nomSaisi]);

  const choisirType = useCallback((type) => {
    if (type === 'Autre') {
      setTypeTemp('Autre');
      setModalTypeVisible(false);
      setCustomTypeInput('');
      setCustomTypeRaceInput('');
      setModalCustomTypeVisible(true);
      return;
    }
    setTypeTemp(type);
    setModalTypeVisible(false);
    setModalSexeVisible(true);
  }, []);

  const validerTypePerso = useCallback(() => {
    const t = (customTypeInput || '').trim();
    if (!t) { Alert.alert('Type requis', 'Saisis le type de l’animal (ex: Lapin).'); return; }
    setTypeTemp(t);
    const r = (customTypeRaceInput || '').trim();
    setRaceTemp(r ? r : '—');
    setModalCustomTypeVisible(false);
    setModalSexeVisible(true);
  }, [customTypeInput, customTypeRaceInput]);

  const choisirSexe = useCallback((sexe) => {
    setSexeTemp(sexe);
    setModalSexeVisible(false);
    const t = (typeTemp || '').toLowerCase();
    if (t === 'chat' || t === 'chien') {
      setRaceTemp(t === 'chat' ? catBreedOptions[0] : dogBreedOptions[0]);
      setModalRaceVisible(true);
    } else {
      setDateTemp(new Date());
      setBirthValid(true);
      setModalDateVisible(true);
    }
  }, [typeTemp, catBreedOptions, dogBreedOptions]);

  const choisirRace = useCallback((r) => {
    if (r === 'Autre') {
      setCustomRaceInput('');
      setModalCustomRaceVisible(true);
    } else {
      setRaceTemp(r);
      setModalRaceVisible(false);
      setDateTemp(new Date());
      setBirthValid(true);
      setModalDateVisible(true);
    }
  }, []);

  const validerRacePerso = useCallback(() => {
    const r = (customRaceInput || '').trim();
    if (!r) { Alert.alert('Race requise', 'Saisis la race.'); return; }
    setRaceTemp(r);
    setModalCustomRaceVisible(false);
    setModalRaceVisible(false);
    setDateTemp(new Date());
    setBirthValid(true);
    setModalDateVisible(true);
  }, [customRaceInput]);

  const validerDate = useCallback(() => {
    if (!birthValid) return;
    setModalDateVisible(false);
    setModalSterilVisible(true);
  }, [birthValid]);

  const ajouterAnimalFinal = useCallback(() => {
    const isoBirth = new Date(dateTemp).toISOString();
    const t = (typeTemp || 'Chat');
    const r = (() => {
      const tl = (t || '').toLowerCase();
      if (tl === 'chat' || tl === 'chien') return (raceTemp || '—');
      return (raceTemp && raceTemp !== '—') ? raceTemp : '—';
    })();

    setAnimaux((prev) => ([
      ...prev,
      {
        id: Date.now().toString(),
        nom: animalTemp,
        type: t,
        sexe: sexeTemp || 'Mâle',
        race: r,
        sterilise: !!sterilTemp,
        photo: null,
        naissance: isoBirth,
        puce: '',
        poids: [],
        soins: [],
      }
    ]));
    setAnimalTemp(''); setTypeTemp(''); setSexeTemp(''); setRaceTemp('—');
    setDateTemp(new Date()); setSterilTemp(false);
    setModalSterilVisible(false);
  }, [animalTemp, typeTemp, sexeTemp, raceTemp, sterilTemp, dateTemp, setAnimaux]);

  const calculAge = useCallback((iso) => {
    const d = new Date(iso), today = new Date();
    let mois = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
    if (today.getDate() < d.getDate()) mois--;
    if (mois < 12) return `${mois} mois`;
    const ans = Math.floor(mois / 12), reste = mois % 12;
    return reste === 0 ? `${ans} ans` : `${ans} ans ${reste} mois`;
  }, []);

  // Groupes/tri
  const buildSections = useCallback((items, triMode) => {
    const map = new Map();
    for (const it of items) {
      const key = (it.type || 'Autre').trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    const types = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    const byAlpha = (a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
    const bySexe = (a, b) =>
      (a.sexe === b.sexe
        ? a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
        : a.sexe === 'Mâle' ? -1 : 1);

    const byAgeAsc = (a, b) => (new Date(a.naissance) - new Date(b.naissance));
    const byAgeDesc = (a, b) => (new Date(b.naissance) - new Date(a.naissance));

    const byPoidsDesc = (a, b) => {
      const w = (x) => {
        const v = lastPoidsKg(x);
        return v == null ? -Infinity : v;
      };
      const wa = w(a), wb = w(b);
      if (wa === -Infinity && wb === -Infinity) return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
      if (wa === -Infinity) return 1;
      if (wb === -Infinity) return -1;
      return wb - wa || a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
    };

    const cmp = ({
      alpha: byAlpha,
      sexe: bySexe,
      ageAsc: byAgeAsc,
      ageDesc: byAgeDesc,
      poidsDesc: byPoidsDesc,
    }[triMode] || byAlpha);

    const flat = [];
    for (const t of types) {
      flat.push({ _header: true, key: `header-${t}`, title: t });
      const arr = [...map.get(t)].sort(cmp);
      if (triMode === 'sexe') {
        const males = arr.filter(a => a.sexe === 'Mâle');
        const femelles = arr.filter(a => a.sexe === 'Femelle');
        for (const it of males) flat.push({ ...it, _header: false, key: it.id });
        for (const it of femelles) flat.push({ ...it, _header: false, key: it.id });
      } else {
        for (const it of arr) flat.push({ ...it, _header: false, key: it.id });
      }
    }
    return flat;
  }, []);

  const [triData, setTriData] = useState(() => buildSections(animaux, triSelected));
  useEffect(() => { setTriData(buildSections(animaux, triSelected)); }, [animaux, triSelected, buildSections]);

  const applySort = useCallback((mode) => { setTriSelected(mode); setTriVisible(false); }, []);
  const openProfile = useCallback((id) => navigation.navigate('Profil', { id }), [navigation]);

  // Swipe refs
  const swipeRefs = React.useRef(new Map());

  // RDV helpers
  const toggleRdvSelect = useCallback((id) => {
    setRdvSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);
  const clearRdv = useCallback(() => {
    setRdvDate(new Date());
    setRdvDateValid(true);
    setRdvHeure('');
    setRdvLieu('');
    setRdvSelectedIds(new Set());
  }, []);
  const saveRdv = useCallback(() => {
    if (!rdvDateValid || !isValidHHMM(rdvHeure) || rdvSelectedIds.size === 0) return;
    const ids = Array.from(rdvSelectedIds);
    const newRdv = {
      id: Date.now().toString(),
      date: rdvDate.toISOString(),
      heureHHMM: rdvHeure,
      lieu: (rdvLieu || '').trim(),
      animalIds: ids,
      notifIds: [],
    };
    addRendezVous(newRdv);
    setRdvOpen(false);
    clearRdv();
    setRdvNotifOpen(true);

    if (interReady) {
      try { interShow(); } catch (e) { console.log('Interstitial show error:', e); }
    } else {
      interLoad();
    }
  }, [
    rdvDate, rdvDateValid, rdvHeure, rdvLieu, rdvSelectedIds,
    addRendezVous, clearRdv, interReady, interShow, interLoad
  ]);

  // Rendu ligne
  const [healthOpenFor, setHealthOpenFor] = useState(null);

  const renderRow = useCallback(({ item }) => {
    if (item._header) {
      return (
        <View style={{ paddingVertical: 8, paddingHorizontal: 4, backgroundColor: '#F0F4FF', borderRadius: 10, marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontWeight: '800', color: '#27418b' }}>{item.title}</Text>
        </View>
      );
    }

    let ref = swipeRefs.current.get(item.id);
    if (!ref) {
      ref = React.createRef();
      swipeRefs.current.set(item.id, ref);
    }

    const onAskDelete = () => {
      Alert.alert(
        'Confirmation',
        `Êtes vous sûr de vouloir supprimer le profil de "${item.nom}" ?`,
        [
          { text: 'Non', style: 'cancel', onPress: () => ref.current?.close?.() },
          {
            text: 'Oui',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Confirmation finale',
                `Êtes vous certain de vouloir supprimer le profil de "${item.nom}" ? Toutes les données seront perdues.`,
                [
                  { text: 'Non', style: 'cancel', onPress: () => ref.current?.close?.() },
                  { text: 'Oui', style: 'destructive', onPress: () => deleteAnimal(item.id) },
                ]
              );
            }
          }
        ]
      );
    };

    const renderRightActions = () => (
      <TouchableOpacity
        onPress={onAskDelete}
        style={{ width: 72, backgroundColor: '#e53935', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 }}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>✖</Text>
      </TouchableOpacity>
    );

    const { color } = computeHealth(item);
    const badgeColor =
      color === 'red' ? '#e53935' : color === 'orange' ? '#fb8c00' : '#2e7d32';

    return (
      <Swipeable ref={ref} renderRightActions={renderRightActions} overshootRight={false}>
        <View>
          <AnimalRow
            item={item}
            onPickPhoto={choisirPhoto}
            onOpenProfile={openProfile}
            ageText={calculAge}
          />
          {color !== 'green' && (
            <View style={{ position: 'absolute', right: 62, top: 12 }}>
              <TouchableOpacity
                onPress={() => setHealthOpenFor(item)}
                activeOpacity={0.85}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: badgeColor,
                  borderWidth: 2,
                  borderColor: '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Swipeable>
    );
  }, [choisirPhoto, openProfile, calculAge, deleteAnimal]);

  /* =========================== UI =========================== */
  return (
    <View style={styles.container}>
      <Text style={styles.titre}>🐾 Ma famille</Text>

      {/* Barre boutons */}
      <View style={styles.buttonsRow}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.btnAjouter} onPress={demarrerAjoutAnimal} activeOpacity={0.9}>
          <Text style={styles.btnAjouterText}>Ajouter un animal</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.btnTri} onPress={() => setTriVisible(true)} activeOpacity={0.9}>
          <Text style={styles.btnTriText}>Tri</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      {/* TRI */}
      <Modal transparent visible={triVisible} animationType="fade" onRequestClose={() => setTriVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setTriVisible(false)} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Trier par</Text>

          {[
            { id: 'alpha', label: 'Ordre alphabétique' },
            { id: 'sexe', label: 'Sexe (Mâles → Femelles)' },
            { id: 'ageAsc', label: 'Âge croissant (plus jeune → plus vieux)' },
            { id: 'ageDesc', label: 'Âge décroissant (plus vieux → plus jeune)' },
            { id: 'poidsDesc', label: 'Poids (plus lourd → plus léger)' },
          ].map((opt) => (
            <Pressable key={opt.id} style={styles.sheetRow} onPress={() => applySort(opt.id)}>
              <Text style={styles.sheetRowText}>{opt.label}</Text>
              <View style={[styles.radioOuter, triSelected === opt.id && styles.radioOuterActive]}>
                {triSelected === opt.id && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          ))}
          <View style={{ height: 10 }} />
        </View>
      </Modal>

      {/* Liste groupée */}
      <FlatList
        style={styles.liste}
        data={triData}
        keyExtractor={(i) => i.key}
        renderItem={renderRow}
        ListEmptyComponent={<Text style={{ marginTop: 20, textAlign: 'center', color: '#555' }}>Aucun animal pour l’instant.</Text>}
        initialNumToRender={12}
        windowSize={7}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 90 }} // espace pour la bannière globale
      />

      {/* FAB Rendez-vous */}
      <TouchableOpacity
        onPress={() => setRdvOpen(true)}
        style={[styles.fab, { bottom: 96 }]}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>📅</Text>
      </TouchableOpacity>

      {/* Modal RDV */}
      <Modal transparent animationType="fade" visible={rdvOpen} onRequestClose={() => setRdvOpen(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { flexDirection: 'column', padding: 16, width: '90%', height: '80%' }]}>
            <ScrollView>
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>Rendez-vous</Text>

              <Text style={{ marginTop: 6, fontWeight: '600' }}>Rendez-vous le :</Text>
              <DateField
                value={rdvDate}
                onChange={setRdvDate}
                maximumDate={new Date(2099, 11, 31)}
                title="JJ/MM/AAAA"
                onValidityChange={setRdvDateValid}
              />

              <Text style={{ marginTop: 10, fontWeight: '600' }}>Heure (HH:MM)</Text>
              <TextInput
                value={rdvHeure}
                onChangeText={(t) => setRdvHeure(maskHHMM(t))}
                placeholder="HH:MM"
                keyboardType="number-pad"
                maxLength={5}
                style={{ borderWidth: 1, borderColor: isValidHHMM(rdvHeure) || rdvHeure === '' ? '#ccc' : '#e53935', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
              />

              <Text style={{ marginTop: 12, fontWeight: '600' }}>Rendez-vous pour :</Text>

              <View style={{ marginTop: 6 }}>
                {(() => {
                  const sections = (function makeSections() {
                    const map = new Map();
                    for (const it of animaux) {
                      const key = (it.type || 'Autre').trim();
                      if (!map.has(key)) map.set(key, []);
                      map.get(key).push(it);
                    }
                    const types = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
                    return types.map((t) => ({
                      type: t,
                      items: map.get(t).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
                    }));
                  })();

                  return sections.map((sec) => (
                    <View key={sec.type} style={{ marginTop: 8, backgroundColor: '#F0F4FF', borderRadius: 10, padding: 8 }}>
                      <Text style={{ fontWeight: '800', color: '#27418b', marginBottom: 6 }}>{sec.type}</Text>
                      {sec.items.map((a) => {
                        const checked = rdvSelectedIds.has(a.id);
                        return (
                          <Pressable
                            key={a.id}
                            onPress={() => toggleRdvSelect(a.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}
                          >
                            <Text>{a.nom}</Text>
                            <View
                              style={{
                                width: 22, height: 22, borderRadius: 4, borderWidth: 2,
                                borderColor: checked ? '#4a90e2' : '#cfd6e2', backgroundColor: checked ? '#e9f2ff' : '#fff',
                                alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {checked ? <Text style={{ color: '#164C88', fontWeight: '900' }}>✓</Text> : null}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>

              <Text style={{ marginTop: 12, fontWeight: '600' }}>Rendez-vous lieu :</Text>
              <TextInput
                value={rdvLieu}
                onChangeText={setRdvLieu}
                placeholder="Vétérinaire de ..."
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginTop: 6 }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <TouchableOpacity onPress={() => { setRdvOpen(false); clearRdv(); }} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveRdv}
                  disabled={!rdvDateValid || !isValidHHMM(rdvHeure) || rdvSelectedIds.size === 0}
                  style={[
                    styles.btnPrimary,
                    (!rdvDateValid || !isValidHHMM(rdvHeure) || rdvSelectedIds.size === 0) && { opacity: 0.5 }
                  ]}
                >
                  <Text style={styles.btnPrimaryText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Config rappels */}
      <Modal transparent animationType="fade" visible={rdvNotifOpen} onRequestClose={() => setRdvNotifOpen(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { flexDirection: 'column', padding: 16, width: '90%', height: '80%' }]}>
            <ScrollView>
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12 }}>Configurer les rappels</Text>

              {[
                { id: '30m', label: '30 minutes avant le RDV', minutes: 30 },
                { id: '1h', label: '1 heure avant le RDV', minutes: 60 },
                { id: '2h', label: '2 heures avant le RDV', minutes: 120 },
                { id: '4h', label: '4 heures avant le RDV', minutes: 240 },
                { id: '8h', label: '8 heures avant le RDV', minutes: 480 },
                { id: '12h', label: '12 heures avant le RDV', minutes: 720 },
                { id: '24h', label: '24 heures avant le RDV', minutes: 1440 },
                { id: '24hVeille20h', label: 'La veille du RDV à 20h', special: 'veille20h' },
              ].map(opt => {
                const checked = notifOptions.has(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setNotifOptions(prev => {
                        const n = new Set(prev);
                        if (n.has(opt.id)) n.delete(opt.id);
                        else n.add(opt.id);
                        return n;
                      });
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}
                  >
                    <Text>{opt.label}</Text>
                    <View
                      style={{
                        width: 22, height: 22, borderRadius: 4, borderWidth: 2,
                        borderColor: checked ? '#4a90e2' : '#cfd6e2', backgroundColor: checked ? '#e9f2ff' : '#fff',
                        alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {checked ? <Text style={{ color: '#164C88', fontWeight: '900' }}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              })}

              <View style={{ marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setCustomNotifOpen(true)}
                  style={[styles.btnPrimary, { alignSelf: 'flex-start' }]}
                >
                  <Text style={styles.btnPrimaryText}>Programmer son rappel</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <TouchableOpacity onPress={() => setRdvNotifOpen(false)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setRdvNotifOpen(false);

                      const rdv = rendezvous[rendezvous.length - 1];
                      if (!rdv) return;

                      const fullRdv = new Date(rdv.date);
                      if (isValidHHMM(rdv.heureHHMM)) {
                        const [hh, mm] = rdv.heureHHMM.split(':').map((n) => parseInt(n, 10));
                        fullRdv.setHours(hh, mm, 0, 0);
                      }

                      const animalNom = (() => {
                        const firstId = rdv.animalIds?.[0];
                        const a = animaux.find(x => x.id === firstId);
                        return a?.nom || 'Ton animal';
                      })();

                      const createdIds = [];

                      for (const id of notifOptions) {
                        let triggerDate;
                        if (id === '24hVeille20h') {
                          const veille = new Date(fullRdv);
                          veille.setDate(veille.getDate() - 1);
                          veille.setHours(20, 0, 0, 0);
                          triggerDate = veille;
                        } else {
                          const optMin = {
                            '30m': 30,
                            '1h': 60,
                            '2h': 120,
                            '4h': 240,
                            '8h': 480,
                            '12h': 720,
                            '24h': 1440,
                          }[id];
                          triggerDate = new Date(fullRdv.getTime() - optMin * 60000);
                        }

                        if (triggerDate <= new Date()) continue;

                        const nid = await notif.scheduleLocal({
                          date: triggerDate,
                          title: 'Rappel rendez-vous',
                          body:
                            id === '24hVeille20h'
                              ? `${animalNom} a son rendez-vous demain à ${fullRdv.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : `${animalNom} a son rendez-vous bientôt`,
                          data: { rdvId: rdv.id },
                        });
                        createdIds.push(nid);
                      }

                      if (customNotifValue && isValidHHMM(customNotifValue)) {
                        const [ch, cm] = customNotifValue.split(':').map((n) => parseInt(n, 10));
                        const minutes = ch * 60 + cm;
                        const triggerDate = new Date(fullRdv.getTime() - minutes * 60000);
                        if (triggerDate > new Date()) {
                          const nid = await notif.scheduleLocal({
                            date: triggerDate,
                            title: 'Rappel personnalisé',
                            body: `${animalNom} — rappel personnalisé`,
                            data: { rdvId: rdv.id },
                          });
                          createdIds.push(nid);
                        }
                      }

                      updateRdv(rdv.id, (old) => ({ ...old, notifIds: [...(old.notifIds || []), ...createdIds] }));
                      setNotifOptions(new Set(['24hVeille20h', '2h']));
                      setCustomNotifValue('');
                      Alert.alert('Rappels programmés', 'Vos rappels ont été programmés !');
                    } catch (e) {
                      console.warn('Notif schedule error:', e);
                      Alert.alert('Erreur', 'Impossible de programmer les rappels.');
                    }
                  }}
                  style={styles.btnPrimary}
                >
                  <Text style={styles.btnPrimaryText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pop-up Rappel personnalisé */}
      <Modal transparent animationType="fade" visible={customNotifOpen} onRequestClose={() => setCustomNotifOpen(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { flexDirection: 'column', padding: 16, width: '80%', height: undefined }]}>
            <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>Programmer son rappel</Text>
            <Text style={{ marginBottom: 6 }}>Combien de temps avant le RDV voulez-vous être notifié ?</Text>
            <TextInput
              value={customNotifValue}
              onChangeText={(t) => setCustomNotifValue(maskHHMM(t))}
              placeholder="HH:MM (ex: 08:00)"
              keyboardType="number-pad"
              maxLength={5}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setCustomNotifOpen(false)} style={styles.btnGhost}>
                <Text style={styles.btnGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCustomNotifOpen(false)} style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu santé */}
      <Modal
        transparent
        animationType="fade"
        visible={!!healthOpenFor}
        onRequestClose={() => setHealthOpenFor(null)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setHealthOpenFor(null)} />
        <View style={[styles.modalContainer, { flexDirection: 'column', padding: 14, width: '85%', height: undefined }]}>
          {healthOpenFor ? (
            <>
              <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 8 }}>
                État — {healthOpenFor.nom}
              </Text>
              {(() => {
                const { issues } = computeHealth(healthOpenFor);
                if (issues.length === 0) {
                  return <Text style={{ color: '#2e7d32' }}>Tout est à jour ✅</Text>;
                }
                return issues.map((it) => {
                  const dot = it.status === 'red' ? '🔴' : it.status === 'orange' ? '🟠' : '🟢';
                  const labelDate = it.dueDate ? ` • prochain: ${new Date(it.dueDate).toLocaleDateString()}` : '';
                  return (
                    <Pressable
                      key={`${it.kind}-${it.name}`}
                      onPress={() => {
                        setHealthOpenFor(null);
                        navigation.navigate(it.goto.screen, it.goto.params);
                      }}
                      style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    >
                      <Text style={{ fontWeight: '600' }}>{dot} {it.name}</Text>
                      {!!labelDate && <Text style={{ color: '#666', marginTop: 3 }}>{labelDate}</Text>}
                    </Pressable>
                  );
                });
              })()}
              <View style={{ alignSelf: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity onPress={() => setHealthOpenFor(null)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </Modal>

      {/* Modales d’ajout : NOM / TYPE / TYPE perso / SEXE / RACE / RACE perso / DATE / STÉRILISÉ */}
      {/* ... (inchangées, déjà incluses ci-dessus) */}
    </View>
  );
}
