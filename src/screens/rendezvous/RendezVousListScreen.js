// src/screens/rendezvous/RendezVousListScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import styles from '../../styles/styles';
import { useAnimals } from '../../context/AnimalsContext';

/* ---------------------- RENDEZ-VOUS — Liste ---------------------- */
export default function RendezVousListScreen({ route }) {
  const id = route?.params?.id;
  const { animaux, rendezvous, removeRendezVous } = useAnimals();
  const animal = animaux.find((a) => a.id === id);

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  const toDate = (r) => {
    const d = new Date(r.date);
    if (r.heureHHMM && /^\d{2}:\d{2}$/.test(r.heureHHMM)) {
      const [hh, mm] = r.heureHHMM.split(':').map((n) => parseInt(n, 10));
      d.setHours(hh, mm, 0, 0);
    }
    return d;
  };

  const rdvs = (rendezvous || [])
    .filter((r) => Array.isArray(r.animalIds) && r.animalIds.includes(animal.id))
    .map((r) => ({ ...r, _dt: toDate(r) }))
    .sort((a, b) => +b._dt - +a._dt); // récents en haut

  const onEdit = () => {
    Alert.alert('Édition', 'Édition du lieu non disponible sur Android pour le moment.');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Rendez-vous — {animal.nom}
        </Text>

        {rdvs.length === 0 ? (
          <Text style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
            Aucun rendez-vous enregistré pour {animal.nom}.
          </Text>
        ) : (
          <View style={{ marginTop: 12 }}>
            {rdvs.map((r) => {
              const isPast = +r._dt < Date.now();
              return (
                <View
                  key={r.id}
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#eee',
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700' }}>
                      {r._dt.toLocaleDateString()} {r.heureHHMM ? `• ${r.heureHHMM}` : ''}
                    </Text>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: isPast ? '#c62828' : '#2e7d32',
                      }}
                    />
                  </View>

                  {!!r.lieu && (
                    <Text style={{ marginTop: 6, color: '#555' }}>
                      Lieu : <Text style={{ fontWeight: '600' }}>{r.lieu}</Text>
                    </Text>
                  )}

                  {Array.isArray(r.animalIds) && r.animalIds.length > 1 && (
                    <Text style={{ marginTop: 4, color: '#777', fontSize: 12 }}>
                      {r.animalIds.length} animaux (rendez-vous partagé)
                    </Text>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                    <TouchableOpacity onPress={onEdit} style={[styles.btnGhost, { paddingVertical: 6, paddingHorizontal: 10 }]}>
                      <Text style={styles.btnGhostText}>Éditer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Supprimer ce rendez-vous ?',
                          'Cette action est irréversible.',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'Supprimer',
                              style: 'destructive',
                              onPress: () => removeRendezVous(r.id),
                            },
                          ],
                        );
                      }}
                      style={[styles.btnPrimary, { backgroundColor: '#e53935', paddingVertical: 6, paddingHorizontal: 10 }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800' }}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
