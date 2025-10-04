// src/screens/rendezvous/ConsultationScreen.js
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../../styles/styles';
import { useAnimals } from '../../context/AnimalsContext';

export default function ConsultationScreen({ route, navigation }) {
  const { id } = route.params;
  const { animaux, rendezvous } = useAnimals();

  const animal = animaux.find(a => a.id === id);

  const { futurs, passes } = useMemo(() => {
    // Si l'animal n'est pas encore disponible (ex: premier rendu), renvoyer des listes vides
    if (!animal) return { futurs: [], passes: [] };

    const toDate = (r) => {
      const d = new Date(r.date);
      if (r.heureHHMM && /^\d{2}:\d{2}$/.test(r.heureHHMM)) {
        const [hh, mm] = r.heureHHMM.split(':').map(n => parseInt(n, 10));
        d.setHours(hh, mm, 0, 0);
      }
      return d;
    };

    const list = (rendezvous || [])
      .filter(r => Array.isArray(r.animalIds) && r.animalIds.includes(animal.id))
      .map(r => ({ ...r, _dt: toDate(r) }));

    const now = Date.now();
    const futursList = list.filter(r => +r._dt >= now).sort((a, b) => +a._dt - +b._dt);
    const passesList = list.filter(r => +r._dt < now).sort((a, b) => +b._dt - +a._dt);

    return { futurs: futursList, passes: passesList };
  }, [rendezvous, animal?.id]);

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  const isEmpty = futurs.length === 0 && passes.length === 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Consultations — {animal.nom}
        </Text>

        {isEmpty && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ textAlign: 'center', color: '#666' }}>
              Aucun rendez-vous pour cet animal.
            </Text>
            <TouchableOpacity
              onPress={() => {
                // Redirige vers l’accueil et ouvre directement le calendrier RDV
                navigation.navigate('Accueil', {
                  openRdvForAnimalId: animal.id,
                  focusRdv: true,
                });
              }}
              style={[styles.btnPrimary, { alignSelf: 'center', marginTop: 12 }]}
            >
              <Text style={styles.btnPrimaryText}>Prendre un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* À venir */}
        {!isEmpty && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>À venir</Text>
            {futurs.length === 0 ? (
              <Text style={{ marginTop: 6, color: '#666' }}>
                Aucun rendez-vous à venir.
              </Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                {futurs.map(r => (
                  <View
                    key={r.id}
                    style={{
                      backgroundColor: '#FAFAFA',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#eee',
                      padding: 12,
                      marginBottom: 10
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700' }}>
                        {r._dt.toLocaleDateString()} {r.heureHHMM ? `• ${r.heureHHMM}` : ''}
                      </Text>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2e7d32' }} />
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
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Historique */}
        {!isEmpty && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Historique</Text>
            {passes.length === 0 ? (
              <Text style={{ marginTop: 6, color: '#666' }}>
                Aucun rendez-vous passé.
              </Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                {passes.map(r => (
                  <View
                    key={r.id}
                    style={{
                      backgroundColor: '#FAFAFA',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#eee',
                      padding: 12,
                      marginBottom: 10
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700' }}>
                        {r._dt.toLocaleDateString()} {r.heureHHMM ? `• ${r.heureHHMM}` : ''}
                      </Text>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#c62828' }} />
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
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
