// src/screens/soins/SoinsHub.js
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';

export default function SoinsHub({ route, navigation }) {
  const id = route?.params?.id;

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ marginBottom: 12 }}>Accès invalide : identifiant animal manquant.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#eee', borderRadius: 8 }}>
          <Text>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Soins
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Vaccins', { id })}
          style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#eee',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Vaccins ➜</Text>
          <Text style={{ color: '#666', marginTop: 6 }}>
            Marque la date exacte pour chaque vaccin (rappel indicatif à 1 an).
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Vermifuge', { id })}
          style={{
            marginTop: 12, padding: 16, borderRadius: 12,
            backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#eee',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            Anti-puce & Vermifuge ➜
          </Text>
          <Text style={{ color: '#666', marginTop: 6 }}>
            Indique la dernière fois, on calcule la prochaine (pastille d’état).
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('AutresSoins', { id })}
          style={{
            marginTop: 12, padding: 16, borderRadius: 12,
            backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#eee',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Autres soins ➜</Text>
          <Text style={{ color: '#666', marginTop: 6 }}>
            Ajoute des traitements (dates, doses, rappels quotidiens).
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
