// ============================================================================
// CONSTANTES
// ============================================================================

export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Paleta de colores disponibles para asignar a miembros
export const PALETTE = {
  terracota:  { color: '#E8804F', name: 'Terracota' },
  oliva:      { color: '#7BA05B', name: 'Oliva' },
  mostaza:    { color: '#F5B645', name: 'Mostaza' },
  rosa:       { color: '#E87A93', name: 'Rosa' },
  durazno:    { color: '#F09872', name: 'Durazno' },
  azul:       { color: '#5B96B0', name: 'Azul' },
  lavanda:    { color: '#9B7FB8', name: 'Lavanda' },
  esmeralda:  { color: '#52A88A', name: 'Esmeralda' },
  arena:      { color: '#C49B6C', name: 'Arena' },
  carmesi:    { color: '#C0392B', name: 'Carmesí' },
};

// ============================================================================
// FECHAS Y RECURRENCIA
// ============================================================================

export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => dateKey(new Date());

export const daysBetween = (a, b) => {
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((b - a) / ms);
};

export const appliesOn = (item, date) => {
  if (!item.recurrence) return dateKey(date) === todayKey();
  const r = item.recurrence;
  const start = r.startDate ? parseKey(r.startDate) : null;
  if (start && date < start) return false;
  switch (r.type) {
    case 'once':    return start && dateKey(date) === r.startDate;
    case 'daily':   return true;
    case 'weekly':  return (r.weekdays || []).includes(date.getDay());
    case 'monthly': return date.getDate() === (r.dayOfMonth || 1);
    case 'custom': {
      if (!start) return false;
      const diff = daysBetween(start, date);
      return diff >= 0 && diff % (r.interval || 2) === 0;
    }
    default: return true;
  }
};

export const recurrenceLabel = (r) => {
  if (!r) return 'Hoy';
  switch (r.type) {
    case 'once':    return 'Única vez';
    case 'daily':   return 'Todos los días';
    case 'weekly': {
      const days = (r.weekdays || []).map(d => DAYS_ES[d]).join(', ');
      return days || 'Semanal';
    }
    case 'monthly': return `Cada día ${r.dayOfMonth || 1}`;
    case 'custom':  return `Cada ${r.interval || 2} días`;
    default: return 'Periódico';
  }
};

// ============================================================================
// PERSISTENCIA EN LOCALSTORAGE
// ============================================================================

const STORAGE_PREFIX = 'benditarutina_';
const ADMIN_PIN_KEY = STORAGE_PREFIX + 'adminPin';

export const loadState = (key, fallback) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const saveState = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {}
};

export const verifyAdminPin = (pin) => {
  const stored = localStorage.getItem(ADMIN_PIN_KEY) || '8382';
  return pin === stored;
};

export const updateAdminPin = (newPin) => {
  if (!/^\d{4}$/.test(newPin)) return false;
  localStorage.setItem(ADMIN_PIN_KEY, newPin);
  return true;
};

export const setInitialAdminPin = (pin) => {
  if (!/^\d{4}$/.test(pin)) return false;
  localStorage.setItem(ADMIN_PIN_KEY, pin);
  return true;
};

// ============================================================================
// ESTRUCTURA INICIAL VACÍA - cada familia configura la suya
// ============================================================================

export const INITIAL_TASKS = [];
export const INITIAL_VERO_TASKS = [];
export const INITIAL_ROUTINES = {};
export const INITIAL_JOBS = [];
export const INITIAL_EVENTS = [];
export const INITIAL_LISTS = [];

// FAMILY ya no se hardcodea — se construye desde el onboarding del usuario.
// Se guarda en localStorage bajo la clave 'family'.
export const FAMILY = {};

// Helper para construir la estructura FAMILY desde los datos del onboarding
export const buildFamilyFromOnboarding = (data) => {
  const family = {};
  data.adults.forEach((adult, i) => {
    const key = adult.id;
    family[key] = {
      name: adult.name,
      initial: adult.name.charAt(0).toUpperCase(),
      color: adult.color,
      isAdmin: true,
      role: 'adult',
    };
  });
  data.kids.forEach((kid) => {
    const key = kid.id;
    family[key] = {
      name: kid.name,
      initial: kid.name.charAt(0).toUpperCase(),
      color: kid.color,
      isAdmin: false,
      role: kid.young ? 'youngKid' : 'kid',
      young: !!kid.young,
    };
  });
  data.helpers.forEach((helper) => {
    const key = helper.id;
    family[key] = {
      name: helper.name,
      initial: helper.name.charAt(0).toUpperCase(),
      color: helper.color,
      isAdmin: false,
      role: 'helper',
    };
  });
  return family;
};

// ============================================================================
// GEOLOCALIZACIÓN Y CLIMA
// ============================================================================

export const getLocation = () => {
  return new Promise((resolve) => {
    const fallback = { lat: -34.4500, lon: -58.5667, name: 'San Fernando' };
    if (!navigator.geolocation) return resolve(fallback);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`);
          const data = await r.json();
          const name = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.county || 'Tu zona';
          resolve({ lat: latitude, lon: longitude, name });
        } catch {
          resolve({ lat: latitude, lon: longitude, name: 'Tu zona' });
        }
      },
      () => resolve(fallback),
      { timeout: 5000, maximumAge: 600000 }
    );
  });
};

export const fetchWeather = async (lat, lon) => {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await r.json();
    return {
      temp: Math.round(data.current_weather.temperature),
      code: data.current_weather.weathercode,
    };
  } catch {
    return null;
  }
};

export const weatherCodeToInfo = (code) => {
  if ([0].includes(code)) return { emoji: '☀️', label: 'Despejado' };
  if ([1,2].includes(code)) return { emoji: '🌤️', label: 'Algo nublado' };
  if ([3].includes(code)) return { emoji: '☁️', label: 'Nublado' };
  if ([45,48].includes(code)) return { emoji: '🌫️', label: 'Niebla' };
  if ([51,53,55,56,57].includes(code)) return { emoji: '🌦️', label: 'Llovizna' };
  if ([61,63,65,66,67,80,81,82].includes(code)) return { emoji: '🌧️', label: 'Lluvia' };
  if ([71,73,75,77,85,86].includes(code)) return { emoji: '🌨️', label: 'Nieve' };
  if ([95,96,99].includes(code)) return { emoji: '⛈️', label: 'Tormenta' };
  return { emoji: '🌡️', label: 'Tiempo' };
};

// ============================================================================
// FORMATEO
// ============================================================================

export const formatMoney = (n) => {
  if (n === 0 || !n) return '$0';
  return '$' + Number(n).toLocaleString('es-AR');
};

export const formatTime = (d) => {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDate = (d) => {
  return `${DAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};