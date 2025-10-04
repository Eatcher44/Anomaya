// src/utils/date.js

/**
 * Formate une Date -> "JJ/MM/AAAA"
 * @param {Date} d
 * @returns {string}
 */
export function formatFrDate(d) {
  if (!(d instanceof Date) || isNaN(+d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Parse "JJ/MM/AAAA" -> Date (valide) ou null
 * @param {string} txt
 * @returns {Date|null}
 */
export function parseFrDate(txt) {
  const m = (txt || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  const d = new Date(yyyy, mm - 1, dd);
  // Vérification stricte (évite 31/02/2024 -> 02/03/2024)
  return (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) ? d : null;
}

/**
 * Masque HH:MM pendant la saisie (ne garde que 4 chiffres, insère ':')
 * @param {string} raw
 * @returns {string}
 */
export function maskHHMM(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/**
 * Valide un texte "HH:MM" sur 24h (00:00 à 23:59)
 * @param {string} txt
 * @returns {boolean}
 */
export function isValidHHMM(txt) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test((txt || '').trim());
}

/* --- Petits helpers optionnels (utiles si tu veux centraliser davantage) --- */

/**
 * Ajoute des mois à une date (sans muter l'originale).
 * @param {Date} d
 * @param {number} m
 * @returns {Date}
 */
export function addMonths(d, m) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + m);
  return nd;
}

/**
 * Ajoute des semaines à une date (sans muter l'originale).
 * @param {Date} d
 * @param {number} w
 * @returns {Date}
 */
export function addWeeks(d, w) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + 7 * w);
  return nd;
}

/**
 * Différence en jours entiers entre deux dates (a - b).
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function diffDays(a, b) {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((+A - +B) / 86400000);
}
