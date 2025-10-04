// src/screens/PoidsScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';

import styles from '../styles/styles';
import DateField from '../components/DateField';
import { useAnimals } from '../context/AnimalsContext';

export default function PoidsScreen({ route }) {
  const { id } = route.params;
  const { animaux, updateAnimal } = useAnimals();
  const animal = animaux.find(a => a.id === id);

  const [poids, setPoids] = useState('');
  const [date, setDate] = useState(new Date());
  const [valid, setValid] = useState(true);

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Animal introuvable.</Text>
      </View>
    );
  }

  // IMPORTANT: ne pas trier le tableau du state en place
  const data = [...(animal.poids || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  function addPoids() {
    const val = parseFloat(String(poids).replace(',', '.'));
    if (!valid || isNaN(val)) return;
    const entry = { id: Date.now().toString(), poids: val, date: date.toISOString() };
    updateAnimal(animal.id, a => ({ ...a, poids: [...(a.poids || []), entry] }));
    setPoids('');
    setDate(new Date());
  }

  // --- Simple mini-graph SVG sans dépendances externes ---
  function LineChart({ points }) {
    const width = 320;
    const height = 160;
    const pad = 18;

    if (!points || points.length < 2) {
      return <Text style={{ textAlign: 'center', color: '#888' }}>Aucun poids enregistré</Text>;
    }

    const ys = points.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const yRange = maxY - minY || 1;

    const stepX = (width - pad * 2) / (points.length - 1);
    const toX = (i) => pad + i * stepX;
    const toY = (y) => pad + (height - pad * 2) * (1 - (y - minY) / yRange);

    const poly = points.map((p, i) => `${toX(i)},${toY(p.y)}`).join(' ');

    return (
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Axes simples */}
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#ccd5e0" strokeWidth="1" />
        <Line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#ccd5e0" strokeWidth="1" />
        {/* Ligne */}
        <Polyline points={poly} fill="none" stroke="#4a90e2" strokeWidth="2.5" />
        {/* Points */}
        {points.map((p, i) => (
          <Circle key={i} cx={toX(i)} cy={toY(p.y)} r="3.5" fill="#4a90e2" />
        ))}
      </Svg>
    );
  }

  const chartPoints = data.map(d => ({ x: new Date(d.date), y: d.poids }));

  const canSave = valid && poids.trim() !== '' && !isNaN(parseFloat(poids.replace(',', '.')));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>
          Suivi du poids — {animal.nom}
        </Text>

        {/* Graphique */}
        <View style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 }}>
          <LineChart points={chartPoints} />
        </View>

        {/* Ajout */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '700' }}>Ajouter un poids</Text>
          <TextInput
            placeholder="Poids (kg)"
            value={poids}
            onChangeText={setPoids}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              marginTop: 8,
              backgroundColor: '#fff',
            }}
          />
          <DateField
            value={date}
            onChange={setDate}
            maximumDate={new Date(2099, 11, 31)}
            title="JJ/MM/AAAA"
            onValidityChange={setValid}
          />
          <TouchableOpacity
            onPress={addPoids}
            disabled={!canSave}
            style={[
              styles.btnPrimary,
              { marginTop: 12 },
              !canSave && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.btnPrimaryText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        {/* Historique */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Historique</Text>
          {data.length === 0 && (
            <Text style={{ color: '#888' }}>Aucun enregistrement</Text>
          )}
          {data.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
              }}
            >
              <Text>{new Date(p.date).toLocaleDateString()}</Text>
              <Text>{p.poids} kg</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
