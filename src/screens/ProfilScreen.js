// src/screens/ProfilScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import styles from '../styles/styles';
import DateField from '../components/DateField';
import { useAnimals } from '../context/AnimalsContext';
import { displayBreed } from '../utils/breeds';

// Helpers
const fmt = (d) => new Date(d).toLocaleDateString();
const isFemale = (a) => (a.sexe || '').toLowerCase().startsWith('f');
const lightBG = (a) => (isFemale(a) ? '#FFE6F3' : '#E6F0FF'); // fond discret

const today = () => new Date();
const inRange = (d, start, end) => +d >= +start && +d <= +end;

export default function ProfilScreen({ route, navigation }) {
  const { id } = route.params;
  const { animaux, updateAnimal, rendezvous } = useAnimals();
  const animal = animaux.find((a) => a.id === id);

  const [editOpen, setEditOpen] = useState(false);

  // Saisie « première fois » du n° de puce en tapant sur la ligne
  const [puceInlineEdit, setPuceInlineEdit] = useState(false);
  const [puceDraft, setPuceDraft] = useState('');

  // État local pour l’édition (modal plein écran)
  const [sexDraft, setSexDraft] = useState('Mâle');
  const [raceDraft, setRaceDraft] = useState('—');
  const [birthDraft, setBirthDraft] = useState(new Date());
  const [birthValid, setBirthValid] = useState(true);
  const [sterilDraft, setSterilDraft] = useState(false);
  const [puceEditDraft, setPuceEditDraft] = useState('');

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  const soins = animal.soins || [];

  const actifsAutresSoins = useMemo(() => {
    // traitements stockés sous type: 'Traitement' (start/debut, end/fin)
    const now = today();
    return soins.filter(
      (s) =>
        s.type === 'Traitement' &&
        s.debut &&
        s.fin &&
        inRange(now, new Date(s.debut), new Date(s.fin))
    );
  }, [soins]);

  const rdvsFuturs = useMemo(() => {
    if (!Array.isArray(rendezvous)) return [];
    const toDate = (r) => {
      const d = new Date(r.date);
      if (r.heureHHMM && /^\d{2}:\d{2}$/.test(r.heureHHMM)) {
        const [hh, mm] = r.heureHHMM.split(':').map((n) => parseInt(n, 10));
        d.setHours(hh, mm, 0, 0);
      }
      return d;
    };
    return rendezvous
      .filter((r) => r.animalIds?.includes(id))
      .map((r) => ({ ...r, _dt: toDate(r) }))
      .filter((r) => +r._dt >= Date.now());
  }, [rendezvous, id]);

  /* ---------- Header (Profil) : photo + nom + bouton éditer en haut-droite ---------- */
  const header = (
    <View
      style={{
        backgroundColor: lightBG(animal),
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e6eaf5',
      }}
    >
      {/* Bouton ÉDITER dans le même cadre (haut-droite) */}
      <TouchableOpacity
        onPress={() => {
          // Pré-remplir les drafts
          setSexDraft(animal.sexe || 'Mâle');
          setRaceDraft(animal.race || '—');
          setBirthDraft(new Date(animal.naissance));
          setBirthValid(true);
          setSterilDraft(!!animal.sterilise);
          setPuceEditDraft(animal.puce || '');
          setEditOpen(true);
        }}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: '#f3f3f3',
          borderWidth: 1,
          borderColor: '#e6e6e6',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 3,
          zIndex: 5,
        }}
      >
        <Text style={{ fontSize: 18 }}>✏️</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#ddd',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginRight: 12,
          }}
        >
          {animal.photo ? (
            <Image source={{ uri: animal.photo }} style={{ width: 72, height: 72 }} />
          ) : (
            <Text style={{ color: '#666', fontSize: 11, textAlign: 'center' }}>
              Pas de photo
            </Text>
          )}
        </View>
        <View style={{ flex: 1, paddingRight: 56 /* laisse la place au crayon */ }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#222' }}>
            {animal.nom} {animal.sexe === 'Femelle' ? '♀' : '♂'}
            {animal.race && animal.race !== '—' ? ` (${displayBreed(animal.race)})` : ''}
          </Text>
          <Text style={{ marginTop: 4, color: '#444' }}>
            {(() => {
              const d = new Date(animal.naissance);
              const t = new Date();
              let m =
                (t.getFullYear() - d.getFullYear()) * 12 +
                (t.getMonth() - d.getMonth());
              if (t.getDate() < d.getDate()) m--;
              if (m < 12) return `${m} mois`;
              const y = Math.floor(m / 12);
              const r = m % 12;
              return r ? `${y} ans ${r} mois` : `${y} ans`;
            })()}
          </Text>
        </View>
      </View>
    </View>
  );

  /* ---------- Fiche récap ---------- */
  const fiche = (
    <View style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontWeight: '800', marginBottom: 8 }}>Fiche</Text>

      {/* Naissance */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
        <Text style={{ color: '#666' }}>Date de naissance</Text>
        <Text style={{ fontWeight: '700' }}>{fmt(animal.naissance)}</Text>
      </View>

      {/* Race */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
        <Text style={{ color: '#666' }}>Race</Text>
        <Text style={{ fontWeight: '700' }}>{animal.race ? displayBreed(animal.race) : '—'}</Text>
      </View>

      {/* Sexe */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
        <Text style={{ color: '#666' }}>Sexe</Text>
        <Text style={{ fontWeight: '700' }}>{animal.sexe}</Text>
      </View>

      {/* Statut stérilisation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
        <Text style={{ color: '#666' }}>
          {isFemale(animal) ? 'Stérilisée' : 'Castré'}
        </Text>
        <Text style={{ fontWeight: '700' }}>{animal.sterilise ? 'Oui' : 'Non'}</Text>
      </View>

      {/* Numéro de puce : premier ajout direct, modification via crayon */}
      <View style={{ paddingVertical: 6 }}>
        <Text style={{ color: '#666' }}>Numéro de puce</Text>

        {(!animal.puce || animal.puce.length === 0) ? (
          puceInlineEdit ? (
            <TextInput
              value={puceDraft}
              onChangeText={(t) => setPuceDraft(t.replace(/\D/g, '').slice(0, 15))}
              keyboardType="number-pad"
              maxLength={15}
              autoFocus
              placeholder="15 chiffres"
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                backgroundColor: '#fff',
              }}
              onSubmitEditing={() => {
                const val = (puceDraft || '').trim();
                updateAnimal(animal.id, (a) => ({ ...a, puce: val }));
                setPuceInlineEdit(false);
              }}
              onBlur={() => {
                const val = (puceDraft || '').trim();
                if (val) updateAnimal(animal.id, (a) => ({ ...a, puce: val }));
                setPuceInlineEdit(false);
              }}
            />
          ) : (
            <Pressable onPress={() => { setPuceDraft(''); setPuceInlineEdit(true); }}>
              <Text style={{ marginTop: 6, fontWeight: '700', color: '#164C88' }}>
                Ajouter le numéro
              </Text>
            </Pressable>
          )
        ) : (
          <Text style={{ marginTop: 6, fontWeight: '700' }}>{animal.puce}</Text>
        )}
      </View>
    </View>
  );

  /* ---------- Soins ---------- */
  const soinsCard = (
    <View style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontWeight: '800', marginBottom: 8 }}>Soins</Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Vaccins', { id: animal.id })}
          style={[styles.dateRect, { flex: 1, alignItems: 'center' }]}
        >
          <Text style={styles.dateRectText}>Vaccins ➜</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Vermifuge', { id: animal.id })}
          style={[styles.dateRect, { flex: 1, alignItems: 'center' }]}
        >
          <Text style={styles.dateRectText}>Anti-puce & Vermifuge ➜</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('AutresSoins', { id: animal.id })}
        style={[styles.btnPrimary, { marginTop: 12, alignSelf: 'flex-start' }]}
      >
        <Text style={styles.btnPrimaryText}>Autres soins / traitements</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 8, color: '#555' }}>
        {actifsAutresSoins.length} soin(s) ou traitement(s) en cours
      </Text>
    </View>
  );

  /* ---------- Gestation/Reproduction (placeholder) ---------- */
  const reproCard = (() => {
    if (animal.sterilise) return null;
    const femelle = isFemale(animal);
    return (
      <View style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: '800', marginBottom: 8 }}>
          {femelle ? 'Gestation' : 'Reproduction'}
        </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('À venir', 'A venir dans le pack Éleveur.')
          }
          style={[styles.btnPrimary, { alignSelf: 'flex-start' }]}
        >
          <Text style={styles.btnPrimaryText}>Ouvrir</Text>
        </TouchableOpacity>
      </View>
    );
  })();

  /* ---------- Rendez-vous ---------- */
  const rdvCard = (
    <View style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontWeight: '800', marginBottom: 8 }}>Rendez-vous de l'animal</Text>

      <Text style={{ color: '#555', marginBottom: 8 }}>
        {rdvsFuturs.length} rendez-vous à venir
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Consultation', { id: animal.id })}
        style={[styles.btnPrimary, { alignSelf: 'flex-start' }]}
      >
        <Text style={styles.btnPrimaryText}>Consultation</Text>
      </TouchableOpacity>
    </View>
  );

  /* ---------- MODAL ÉDITION plein écran (inchangé) ---------- */
  const EditModal = (
    <Modal transparent animationType="slide" visible={editOpen} onRequestClose={() => setEditOpen(false)}>
      <View style={styles.modalBackground}>
        <View
          style={[
            styles.modalContainer,
            {
              flexDirection: 'column',
              width: '92%',
              height: '88%',
              padding: 16,
            },
          ]}
        >
          <ScrollView>
            <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 12 }}>
              Éditer le profil
            </Text>

            {/* Sexe */}
            <Text style={{ marginBottom: 6 }}>Sexe</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setSexDraft('Mâle')}
                style={[styles.radioPill, sexDraft === 'Mâle' && styles.radioPillActive]}
              >
                <Text style={[styles.radioPillText, sexDraft === 'Mâle' && styles.radioPillTextActive]}>
                  ♂ Mâle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSexDraft('Femelle')}
                style={[styles.radioPill, sexDraft === 'Femelle' && styles.radioPillActive]}
              >
                <Text style={[styles.radioPillText, sexDraft === 'Femelle' && styles.radioPillTextActive]}>
                  ♀ Femelle
                </Text>
              </TouchableOpacity>
            </View>

            {/* Race */}
            <Text style={{ marginBottom: 6 }}>Race</Text>
            <TextInput
              value={raceDraft}
              onChangeText={setRaceDraft}
              placeholder="Race (ex: Maine Coon)"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 }}
            />

            {/* Naissance */}
            <Text style={{ marginBottom: 6 }}>Date de naissance</Text>
            <DateField
              value={birthDraft}
              onChange={setBirthDraft}
              maximumDate={new Date()}
              title="JJ/MM/AAAA"
              onValidityChange={setBirthValid}
            />

            {/* Stérilisation */}
            <Text style={{ marginTop: 12, marginBottom: 6 }}>
              {sexDraft === 'Femelle' ? 'Stérilisée ?' : 'Castré ?'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setSterilDraft(true)}
                style={[styles.radioPill, sterilDraft && styles.radioPillActive]}
              >
                <Text style={[styles.radioPillText, sterilDraft && styles.radioPillTextActive]}>Oui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSterilDraft(false)}
                style={[styles.radioPill, !sterilDraft && styles.radioPillActive]}
              >
                <Text style={[styles.radioPillText, !sterilDraft && styles.radioPillTextActive]}>Non</Text>
              </TouchableOpacity>
            </View>

            {/* Numéro de puce (clavier numérique / 15 chiffres) */}
            <Text style={{ marginBottom: 6 }}>Numéro de puce</Text>
            <TextInput
              value={puceEditDraft}
              onChangeText={(t) => setPuceEditDraft(t.replace(/\D/g, '').slice(0, 15))}
              keyboardType="number-pad"
              maxLength={15}
              placeholder="15 chiffres"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
            />

            <View style={{ height: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.btnGhost}>
                <Text style={styles.btnGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!birthValid) {
                    Alert.alert('Date invalide', 'La date de naissance est invalide.');
                    return;
                  }
                  updateAnimal(animal.id, (a) => ({
                    ...a,
                    sexe: sexDraft,
                    race: raceDraft || '—',
                    naissance: new Date(birthDraft).toISOString(),
                    sterilise: !!sterilDraft,
                    puce: (puceEditDraft || '').trim(),
                  }));
                  setEditOpen(false);
                }}
                style={styles.btnPrimary}
              >
                <Text style={styles.btnPrimaryText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
        {header}
        {/* Récap / Soins / (Repro si applicable) / RDV */}
        <View>{fiche}</View>
        <View>{soinsCard}</View>
        {!!(!animal.sterilise) && <View>{reproCard}</View>}
        <View>{rdvCard}</View>
      </ScrollView>

      {EditModal}
    </View>
  );
}
