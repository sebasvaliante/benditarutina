// ============================================================
//  lib.js — utilidades centrales
// ============================================================

export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const parseKey = (k) => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
export const daysBetween = (a, b) => Math.floor((b - a) / 86400000);

export const appliesOn = (item, date) => {
  if (!item.recurrence || item.recurrence.type === 'once') {
    return item.recurrence?.startDate === dateKey(date);
  }
  const start = parseKey(item.recurrence.startDate);
  if (date < start) return false;
  const r = item.recurrence;
  switch (r.type) {
    case 'daily': return true;
    case 'weekly': return r.weekdays?.includes(date.getDay());
    case 'monthly': return date.getDate() === r.dayOfMonth;
    case 'custom': return daysBetween(start, date) % r.interval === 0;
    default: return false;
  }
};

export const recurrenceLabel = (r) => {
  if (!r || r.type === 'once') return 'Única vez';
  if (r.type === 'daily') return 'Todos los días';
  if (r.type === 'weekly') {
    if (!r.weekdays?.length) return 'Semanal';
    if (r.weekdays.length === 7) return 'Todos los días';
    if (r.weekdays.length === 5 && [1,2,3,4,5].every(d => r.weekdays.includes(d))) return 'Días de semana';
    if (r.weekdays.length === 2 && [0,6].every(d => r.weekdays.includes(d))) return 'Fines de semana';
    return r.weekdays.sort().map(d => DAYS_ES[d]).join(', ');
  }
  if (r.type === 'monthly') return `Día ${r.dayOfMonth} de cada mes`;
  if (r.type === 'custom') return `Cada ${r.interval} días`;
  return '';
};

export const todayKey = () => dateKey(new Date());

const STORAGE_PREFIX = 'benditarutina_';

export const loadState = (key, defaultValue) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

export const saveState = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Error guardando estado:', e);
  }
};

export const clearAllState = () => {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
  });
};

export const ADMIN_PIN = '8382';

export const verifyAdminPin = (pin) => {
  const stored = loadState('admin_pin', ADMIN_PIN);
  return pin === stored;
};

export const updateAdminPin = (newPin) => {
  saveState('admin_pin', newPin);
};

export const FAMILY = {
  sebas: { name: 'Sebas', color: '#E8804F', initial: 'S', isAdmin: true },
  belu:  { name: 'Belu',  color: '#7BA05B', initial: 'B', isAdmin: true },
  juani: { name: 'Juani', color: '#F5B645', initial: 'J', age: 10, isKid: true },
  delfi: { name: 'Delfi', color: '#E87A93', initial: 'D', age: 7,  isKid: true },
  fran:  { name: 'Fran',  color: '#F09872', initial: 'F', age: 3,  isKid: true },
  vero:  { name: 'Vero',  color: '#5B96B0', initial: 'V' },
};

// Sin tareas iniciales — la familia las crea
export const INITIAL_TASKS = [];

// Rutinas iguales para las 3 nenas
const KID_ROUTINE = [
  { id: 1, text: 'Vestirse', label: 'Vestirse', icon: '👕', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 2, text: 'Desayuno', label: 'Desayuno', icon: '🥣', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 3, text: 'Lavarse los dientes', label: 'Dientes', icon: '🪥', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 4, text: 'Peinarse', label: 'Peinarse', icon: '💆', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 5, text: 'Crema y OFF', label: 'Crema/OFF', icon: '🧴', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 6, text: 'Abrigarse', label: 'Abrigarse', icon: '🧥', recurrence: { type: 'daily', startDate: '2026-05-01' } },
];

export const INITIAL_ROUTINES = {
  juani: KID_ROUTINE.map(r => ({ ...r })),
  delfi: KID_ROUTINE.map(r => ({ ...r })),
  fran:  KID_ROUTINE.map(r => ({ ...r })),
};

// Tareas iniciales para Vero
export const INITIAL_VERO_TASKS = [
  // === DIARIAS ===
  { id: 101, text: 'Preparar desayuno',     who: 'vero', time: '07:00', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 102, text: 'Preparar lunch',        who: 'vero', time: null,    recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 103, text: 'Ayudar a las chicas a salir al colegio', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 104, text: 'Dejar uniformes listos para el día siguiente', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 105, text: 'Cocina impecable (mesada, anafe, bacha)', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 106, text: 'Repasar pisos planta baja', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 107, text: 'Repasar pisos planta alta', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 108, text: 'Limpiar baños',         who: 'vero', time: null,    recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 109, text: 'Ordenar galería',       who: 'vero', time: null,    recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 110, text: 'Lavar / secar / planchar según necesidad', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 111, text: 'Revisar planchado de Sebas', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 112, text: 'Preparar almuerzo',     who: 'vero', time: '12:00', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 113, text: 'Preparar merienda',     who: 'vero', time: '16:30', recurrence: { type: 'daily', startDate: '2026-05-01' } },
  { id: 114, text: 'Preparar cena (si corresponde)', who: 'vero', time: null, recurrence: { type: 'daily', startDate: '2026-05-01' } },

  // === LUNES (weekday 1) ===
  { id: 201, text: 'Aspirar planta baja y alta', who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [1], startDate: '2026-05-01' } },
  { id: 202, text: 'Baños a fondo',         who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [1], startDate: '2026-05-01' } },
  { id: 203, text: 'Revisar parrilla',      who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [1], startDate: '2026-05-01' } },

  // === MARTES (weekday 2) ===
  { id: 301, text: 'Limpiar horno',         who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [2], startDate: '2026-05-01' } },
  { id: 302, text: 'Limpiar microondas',    who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [2], startDate: '2026-05-01' } },
  { id: 303, text: 'Limpiar extractor',     who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [2], startDate: '2026-05-01' } },

  // === MIÉRCOLES (weekday 3) ===
  { id: 401, text: 'Aspirar planta baja y alta', who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [3], startDate: '2026-05-01' } },
  { id: 402, text: 'Cambiar sábanas (lavar y poner)', who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [3], startDate: '2026-05-01' } },
  { id: 403, text: 'Sacar telarañas',       who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [3], startDate: '2026-05-01' } },

  // === JUEVES (única vez en mayo 2026, fechas reales) ===
  // 2026 los jueves de mayo son: 7, 14, 21, 28
  { id: 501, text: 'Limpieza profunda: interior muebles cocina + cajones', who: 'vero', time: null, recurrence: { type: 'once', startDate: '2026-05-07' } },
  { id: 502, text: 'Limpieza profunda: heladera + fundas sillones (interior y exterior)', who: 'vero', time: null, recurrence: { type: 'once', startDate: '2026-05-14' } },
  { id: 503, text: 'Limpieza profunda: lámparas y pantallas + estantes + debajo de muebles grandes', who: 'vero', time: null, recurrence: { type: 'once', startDate: '2026-05-21' } },
  { id: 504, text: 'Limpieza profunda: rieles y guías ventanas + zócalos y marcos', who: 'vero', time: null, recurrence: { type: 'once', startDate: '2026-05-28' } },

  // === VIERNES (weekday 5) ===
  { id: 601, text: 'Aspirar planta baja y alta', who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [5], startDate: '2026-05-01' } },
  { id: 602, text: 'Limpiar vidrios planta baja', who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [5], startDate: '2026-05-01' } },
  { id: 603, text: 'Pisos y muebles de galería', who: 'vero', time: null, recurrence: { type: 'weekly', weekdays: [5], startDate: '2026-05-01' } },
];

// Sin trabajos iniciales — la familia los crea
export const INITIAL_JOBS = [];

// Sin eventos iniciales — la familia los crea
export const INITIAL_EVENTS = [];

// Sin listas iniciales — la familia las crea
export const INITIAL_LISTS = [];

// === GEOLOCALIZACIÓN + CLIMA ===
const FALLBACK_LOCATION = { lat: -34.4458, lon: -58.5586, name: 'San Fernando' };

export const getLocation = () => {
  return new Promise((resolve) => {
    const cached = loadState('location', null);
    if (cached) {
      resolve(cached);
      return;
    }
    if (!navigator.geolocation) {
      resolve(FALLBACK_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=es`);
          const data = await response.json();
          const name = data.results?.[0]?.name || 'Tu ubicación';
          const location = { lat, lon, name };
          saveState('location', location);
          resolve(location);
        } catch {
          const location = { lat, lon, name: 'Tu ubicación' };
          saveState('location', location);
          resolve(location);
        }
      },
      () => resolve(FALLBACK_LOCATION),
      { timeout: 5000 }
    );
  });
};

export const fetchWeather = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      temp: Math.round(data.current.temperature_2m),
      code: data.current.weather_code,
    };
  } catch {
    return { temp: 22, code: 0 };
  }
};

export const weatherCodeToInfo = (code) => {
  if (code === 0) return { emoji: '☀️', desc: 'Despejado' };
  if (code <= 3) return { emoji: '⛅', desc: 'Parcialmente nublado' };
  if (code <= 48) return { emoji: '🌫️', desc: 'Nublado' };
  if (code <= 67) return { emoji: '🌧️', desc: 'Lluvia' };
  if (code <= 77) return { emoji: '🌨️', desc: 'Nieve' };
  if (code <= 82) return { emoji: '🌧️', desc: 'Chaparrones' };
  if (code <= 99) return { emoji: '⛈️', desc: 'Tormenta' };
  return { emoji: '🌤️', desc: '' };
};

export const formatMoney = (v) => `$${v.toLocaleString('es-AR')}`;
export const formatTime = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
export const formatDate = (d) => `${DAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;