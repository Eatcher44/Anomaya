// src/styles/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  /* Layout de base */
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titre: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#222',
  },

  /* Boutons génériques */
  btnPrimary: {
    backgroundColor: '#164C88',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfd6e2',
    backgroundColor: '#fff',
  },
  btnGhostText: {
    color: '#164C88',
    fontWeight: '700',
  },

  /* Radios/pills */
  radioPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cfd6e2',
    backgroundColor: '#fff',
  },
  radioPillActive: {
    borderColor: '#164C88',
    backgroundColor: '#e9f2ff',
  },
  radioPillText: {
    color: '#333',
    fontWeight: '600',
  },
  radioPillTextActive: {
    color: '#164C88',
  },

  /* Barre d’actions en haut de Home */
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  btnAjouter: {
    backgroundColor: '#164C88',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnAjouterText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnTri: {
    backgroundColor: '#f1f4fb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6eaf5',
  },
  btnTriText: {
    color: '#27418b',
    fontWeight: '700',
  },

  /* Liste & carte animal */
  liste: { flex: 1 },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e6eaf5',
  },
  photoContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e6eaf5',
  },
  itemPhoto: { width: 72, height: 72 },
  addPhotoText: { textAlign: 'center', fontSize: 11, color: '#666' },
  itemTextContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  item: { fontSize: 18, fontWeight: '800', color: '#222' },
  ageText: { marginTop: 2, color: '#444' },
  poidsText: { marginTop: 2, color: '#555', fontWeight: '600' },
  flecheContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  /* Bottom sheet (Tri) */
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e0e6f0',
    marginBottom: 8,
  },
  sheetTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sheetRowText: { fontSize: 15, color: '#222' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cfd6e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#164C88', backgroundColor: '#e9f2ff' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#164C88' },

  /* Modales génériques */
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '80%',
  },

  /* Sélecteur de type (Chat/Chien/Autre) */
  typeButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  typeImage: { width: 72, height: 72, marginBottom: 8, resizeMode: 'contain' },
  typeText: { fontWeight: '700', color: '#222' },

  /* Liste des races */
  breedRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  breedText: { fontSize: 16, color: '#222' },

  /* Petits rectangles (dates, raccourcis…) */
  dateRect: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f1f4fb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6eaf5',
  },
  dateRectText: { fontWeight: '700', color: '#27418b' },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 16,
    borderRadius: 28,
    width: 56,
    height: 56,
    backgroundColor: '#164C88',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: { fontSize: 24, color: '#fff' },
});
