// src/components/DateField.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { formatFrDate, parseFrDate } from '../utils/date';

export default function DateField({
  value,
  onChange,
  maximumDate = new Date(),
  title,
  placeholder = 'JJ/MM/AAAA',
  onValidityChange,
}) {
  const [typed, setTyped] = useState(
    value instanceof Date && !isNaN(+value) ? formatFrDate(value) : ''
  );
  const [error, setError] = useState('');

  // Sync quand la valeur externe change
  useEffect(() => {
    if (value instanceof Date && !isNaN(+value)) {
      const txt = formatFrDate(value);
      setTyped(txt);
      validate(txt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Masque "JJ/MM/AAAA" pendant la frappe
  const maskAndTrim = useCallback((raw) => {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }, []);

  // Validation + émission de validité
  const validate = useCallback(
    (txt) => {
      if (!txt || txt.length < 10) {
        setError('Format attendu : JJ/MM/AAAA');
        onValidityChange && onValidityChange(false);
        return null;
      }
      const d = parseFrDate(txt);
      if (!d) {
        setError('Date invalide (ex: 05/09/2024)');
        onValidityChange && onValidityChange(false);
        return null;
      }
      const max = maximumDate || new Date();
      if (d > max) {
        setError('La date ne peut pas être dans le futur');
        onValidityChange && onValidityChange(false);
        return null;
      }
      setError('');
      onValidityChange && onValidityChange(true);
      return d;
    },
    [maximumDate, onValidityChange]
  );

  const handleChange = useCallback(
    (txt) => {
      const masked = maskAndTrim(txt);
      setTyped(masked);
      const d = validate(masked);
      if (d) onChange && onChange(d);
    },
    [maskAndTrim, validate, onChange]
  );

  const onEnd = useCallback(() => {
    const d = validate(typed);
    if (d) onChange && onChange(d);
  }, [typed, validate, onChange]);

  return (
    <View style={{ alignSelf: 'stretch' }}>
      {title ? <Text style={{ marginBottom: 6, fontWeight: '600' }}>{title}</Text> : null}
      <TextInput
        value={typed}
        onChangeText={handleChange}
        onEndEditing={onEnd}
        placeholder={placeholder}
        keyboardType="number-pad"
        maxLength={10}
        style={{
          borderWidth: 1,
          borderColor: error ? '#e53935' : '#ccc',
          borderRadius: 8,
          padding: 10,
          backgroundColor: '#fff',
        }}
      />
      {!!error && (
        <Text style={{ marginTop: 6, fontSize: 12, color: '#e53935' }}>{error}</Text>
      )}
    </View>
  );
}
