import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, off } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyASSCqZo7jAg5mEwZHzwbeV3B7oK-2ajvQ",
  authDomain: "bendita-rutina.firebaseapp.com",
  databaseURL: "https://bendita-rutina-default-rtdb.firebaseio.com",
  projectId: "bendita-rutina",
  storageBucket: "bendita-rutina.firebasestorage.app",
  messagingSenderId: "711433761812",
  appId: "1:711433761812:web:31a4da28c997e7833a6301"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Generador de códigos de familia legibles
export const generateFamilyCode = () => {
  const adjectives = ['feliz', 'sabio', 'tranquilo', 'lindo', 'fuerte', 'libre', 'bendita', 'calmo', 'noble', 'amigo'];
  const nouns = ['casa', 'familia', 'sol', 'luna', 'mar', 'rio', 'cielo', 'arbol', 'flor', 'bosque'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
};

// Suscribirse a los datos de una familia
export const subscribeFamilyData = (familyCode, onUpdate) => {
  const familyRef = ref(db, `families/${familyCode}`);
  onValue(familyRef, (snapshot) => {
    onUpdate(snapshot.val());
  });
  return () => off(familyRef);
};

// Guardar datos de una familia
export const saveFamilyData = async (familyCode, data) => {
  const familyRef = ref(db, `families/${familyCode}`);
  try {
    await set(familyRef, { ...data, updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error('Error guardando en Firebase:', e);
    return false;
  }
};

// Verificar si un código de familia existe
export const checkFamilyCodeExists = (familyCode) => {
  return new Promise((resolve) => {
    const familyRef = ref(db, `families/${familyCode}`);
    onValue(familyRef, (snapshot) => {
      resolve(snapshot.exists());
      off(familyRef);
    }, { onlyOnce: true });
  });
};