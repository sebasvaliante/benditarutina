import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, off, remove } from 'firebase/database';

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

// ============================================================================
// VIAJES (Bendito Viaje — /viaje.html)
// ============================================================================

// Generador de códigos de viaje legibles
export const generateTripCode = () => {
  const adjectives = ['lindo', 'libre', 'gran', 'feliz', 'dorado', 'azul', 'salvaje', 'eterno', 'magico', 'bendito'];
  const nouns = ['viaje', 'ruta', 'destino', 'mapa', 'brujula', 'faro', 'isla', 'puerto', 'horizonte', 'aventura'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
};

// Suscribirse a los datos de un viaje
export const subscribeTripData = (tripCode, onUpdate) => {
  const tripRef = ref(db, `trips/${tripCode}`);
  onValue(tripRef, (snapshot) => {
    onUpdate(snapshot.val());
  });
  return () => off(tripRef);
};

// Guardar un nodo puntual del viaje (config, events/xyz, members/xyz, docs/xyz).
// Se escribe por subruta para no pisar los cambios simultáneos de otros viajeros.
export const saveTripNode = async (tripCode, path, value) => {
  try {
    await set(ref(db, `trips/${tripCode}/${path}`), value);
    await set(ref(db, `trips/${tripCode}/updatedAt`), Date.now());
    return true;
  } catch (e) {
    console.error('Error guardando viaje en Firebase:', e);
    return false;
  }
};

export const removeTripNode = async (tripCode, path) => {
  try {
    await remove(ref(db, `trips/${tripCode}/${path}`));
    await set(ref(db, `trips/${tripCode}/updatedAt`), Date.now());
    return true;
  } catch (e) {
    console.error('Error borrando en Firebase:', e);
    return false;
  }
};

// Verificar si un código de viaje existe
export const checkTripCodeExists = (tripCode) => {
  return new Promise((resolve) => {
    const tripRef = ref(db, `trips/${tripCode}`);
    onValue(tripRef, (snapshot) => {
      resolve(snapshot.exists());
      off(tripRef);
    }, { onlyOnce: true });
  });
};