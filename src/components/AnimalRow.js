// src/components/AnimalRow.js
import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from '../styles/styles';
import { displayBreed } from '../utils/breeds';

function lastPoidsKg(animal) {
  if (!Array.isArray(animal?.poids) || animal.poids.length === 0) return null;
  const last = [...animal.poids].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  return typeof last?.poids === 'number' ? last.poids : null;
}

/**
 * Ligne de la liste d’animaux (Accueil)
 * - Fond discret dépendant du sexe (♂ bleu / ♀ rose).
 * - Plus d’indicateur d’état interne ici (seul l’état est géré dans HomeScreen).
 */
function AnimalRow({ item, onPickPhoto, onOpenProfile, ageText }) {
  const poids = lastPoidsKg(item);
  const isFemale = (item.sexe || '').toLowerCase().startsWith('f');
  const sexeSymbol = isFemale ? '♀' : '♂';
  const sexeColor = isFemale ? '#ff5fa3' : '#2b6fff';
  const bgSoft = isFemale ? '#FFE6F3' : '#E6F0FF';

  return (
    <View style={[styles.itemCard, { backgroundColor: bgSoft }]}>
      {/* Photo */}
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => onPickPhoto?.(item.id)}
        activeOpacity={0.8}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.itemPhoto} />
        ) : (
          <Text style={styles.addPhotoText}>Ajouter{'\n'}une photo</Text>
        )}
      </TouchableOpacity>

      {/* Texte */}
      <View style={styles.itemTextContainer}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.item} numberOfLines={2}>
            {item.nom}{' '}
            <Text style={{ color: sexeColor }}>{sexeSymbol}</Text>{' '}
            {item.race ? `(${displayBreed(item.race)})` : ''}
          </Text>
          <Text style={styles.ageText}>{ageText?.(item.naissance) || ''}</Text>
          <Text style={styles.poidsText}>
            {poids == null ? 'Poids inconnu' : `${poids} kg`}
          </Text>
        </View>

        {/* Flèche d’accès profil */}
        <TouchableOpacity
          style={[styles.flecheContainer, { backgroundColor: '#2b6fff' }]}
          onPress={() => onOpenProfile?.(item.id)}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(AnimalRow);
