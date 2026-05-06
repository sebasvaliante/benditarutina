// ============================================================================
// CONSTANTES
// ============================================================================

export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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

export const DEFAULT_BONUS_PCT = 30;

// ============================================================================
// MASCOTAS
// ============================================================================

export const PET_TYPES = [
  { id: 'dog',    label: 'Perro',   emoji: '🐶' },
  { id: 'cat',    label: 'Gato',    emoji: '🐱' },
  { id: 'bird',   label: 'Pájaro',  emoji: '🦜' },
  { id: 'rabbit', label: 'Conejo',  emoji: '🐰' },
  { id: 'fish',   label: 'Pez',     emoji: '🐠' },
  { id: 'turtle', label: 'Tortuga', emoji: '🐢' },
  { id: 'hamster',label: 'Hámster', emoji: '🐹' },
  { id: 'other',  label: 'Otro',    emoji: '🐾' },
];

export const getPetEmoji = (typeId) => PET_TYPES.find(t => t.id === typeId)?.emoji || '🐾';
export const getPetTypeLabel = (typeId) => PET_TYPES.find(t => t.id === typeId)?.label || 'Mascota';

// ============================================================================
// TEMPLATES DE RUTINAS PREDEFINIDAS
// ============================================================================

export const ROUTINE_TEMPLATES = {
  young: [
    {
      id: 'young_morning',
      name: 'Mañana de los chiquitos',
      description: 'Para empezar el día con todo listo',
      icon: '🌅',
      points: 1,
      steps: [
        { label: 'Levantarme', icon: '🛏️', points: 1 },
        { label: 'Hacer pis', icon: '🚽', points: 1 },
        { label: 'Vestirme', icon: '👕', points: 1 },
        { label: 'Desayunar', icon: '🥣', points: 1 },
        { label: 'Lavarme los dientes', icon: '🪥', points: 1 },
      ],
    },
    {
      id: 'young_night',
      name: 'Antes de dormir',
      description: 'Rutina de la noche, pasos simples',
      icon: '🌙',
      points: 1,
      steps: [
        { label: 'Bañarme', icon: '🚿', points: 1 },
        { label: 'Pijama', icon: '👕', points: 1 },
        { label: 'Lavarme los dientes', icon: '🪥', points: 1 },
        { label: 'Cuento o canción', icon: '📚', points: 1 },
      ],
    },
    {
      id: 'young_meals',
      name: 'En la mesa',
      description: 'Cosas que hacemos al comer',
      icon: '🍽️',
      points: 1,
      steps: [
        { label: 'Lavarme las manos', icon: '🧼', points: 1 },
        { label: 'Sentarme bien', icon: '🪑', points: 1 },
        { label: 'Comer todo', icon: '🍽️', points: 2 },
        { label: 'Llevar el plato', icon: '🍴', points: 1 },
      ],
    },
  ],
  kid: [
    {
      id: 'kid_morning',
      name: 'Mañana de cole',
      description: 'Todo lo que hace falta antes de salir',
      icon: '🎒',
      points: 1,
      steps: [
        { text: 'Levantarme con la primera alarma', icon: '⏰', points: 2 },
        { text: 'Hacer la cama', icon: '🛏️', points: 1 },
        { text: 'Vestirme con el uniforme', icon: '👕', points: 1 },
        { text: 'Desayunar tranquilo', icon: '🥣', points: 1 },
        { text: 'Lavarme los dientes', icon: '🪥', points: 1 },
        { text: 'Revisar la mochila', icon: '🎒', points: 2 },
      ],
    },
    {
      id: 'kid_homework',
      name: 'Tarea y estudio',
      description: 'Después del cole',
      icon: '📚',
      points: 2,
      steps: [
        { text: 'Sacar la merienda y comer', icon: '🍎', points: 1 },
        { text: 'Revisar agenda escolar', icon: '📓', points: 1 },
        { text: 'Hacer la tarea', icon: '✏️', points: 3 },
        { text: 'Guardar útiles en la mochila', icon: '🎒', points: 1 },
      ],
    },
    {
      id: 'kid_night',
      name: 'Rutina de noche',
      description: 'Para llegar bien a la cama',
      icon: '🌙',
      points: 1,
      steps: [
        { text: 'Bañarme', icon: '🚿', points: 2 },
        { text: 'Ponerme el pijama', icon: '👕', points: 1 },
        { text: 'Lavarme los dientes', icon: '🪥', points: 1 },
        { text: 'Preparar lo del día siguiente', icon: '🎒', points: 1 },
        { text: 'Lectura 15 minutos', icon: '📖', points: 2 },
      ],
    },
    {
      id: 'kid_chores',
      name: 'Ayuda en casa',
      description: 'Tareas chicas para colaborar',
      icon: '🏠',
      points: 2,
      steps: [
        { text: 'Ordenar mi cuarto', icon: '🧸', points: 2 },
        { text: 'Poner la mesa', icon: '🍽️', points: 1 },
        { text: 'Levantar la mesa después de comer', icon: '🍴', points: 1 },
        { text: 'Sacar la ropa sucia al canasto', icon: '🧺', points: 1 },
      ],
    },
    {
      id: 'kid_health',
      name: 'Hábitos saludables',
      description: 'Pequeñas cosas que suman a largo plazo',
      icon: '💪',
      points: 1,
      steps: [
        { text: 'Tomar al menos 4 vasos de agua', icon: '💧', points: 2 },
        { text: 'Comer una fruta', icon: '🍎', points: 1 },
        { text: 'Moverme o jugar afuera 30 min', icon: '⚽', points: 2 },
        { text: 'Estar sin pantallas en la mesa', icon: '📵', points: 2 },
      ],
    },
  ],
  preteen: [
    {
      id: 'preteen_morning',
      name: 'Mañana autogestionada',
      description: 'Empezar el día sin que nadie te avise',
      icon: '🌅',
      points: 2,
      steps: [
        { text: 'Despertarme con mi propia alarma', icon: '⏰', points: 3 },
        { text: 'Hacer la cama', icon: '🛏️', points: 1 },
        { text: 'Higiene completa (cara, dientes, peinarme)', icon: '🪥', points: 2 },
        { text: 'Vestirme apropiado para el día', icon: '👕', points: 1 },
        { text: 'Desayunar y lavar lo que usé', icon: '🥣', points: 2 },
        { text: 'Tener todo listo 10 min antes de salir', icon: '🎒', points: 3 },
      ],
    },
    {
      id: 'preteen_study',
      name: 'Estudio y responsabilidades',
      description: 'Para la tarde, después del colegio',
      icon: '📚',
      points: 3,
      steps: [
        { text: 'Revisar tareas y exámenes próximos', icon: '📅', points: 2 },
        { text: 'Hacer la tarea con concentración', icon: '✏️', points: 4 },
        { text: 'Repasar 20 minutos lo que vi en clase', icon: '📖', points: 3 },
        { text: 'Organizar la mochila para mañana', icon: '🎒', points: 1 },
      ],
    },
    {
      id: 'preteen_night',
      name: 'Cierre del día',
      description: 'Para descansar bien',
      icon: '🌙',
      points: 2,
      steps: [
        { text: 'Dejar el celular a cargar fuera del cuarto', icon: '📱', points: 3 },
        { text: 'Ducha o higiene de noche', icon: '🚿', points: 2 },
        { text: 'Lectura o algo tranquilo 20 min', icon: '📖', points: 2 },
        { text: 'Dormir antes de las 22:30', icon: '😴', points: 3 },
      ],
    },
    {
      id: 'preteen_independence',
      name: 'Autonomía en casa',
      description: 'Tareas para colaborar como adolescente',
      icon: '🏠',
      points: 3,
      steps: [
        { text: 'Mantener mi cuarto ordenado', icon: '🛏️', points: 2 },
        { text: 'Lavar mi ropa (o ayudar)', icon: '🧺', points: 3 },
        { text: 'Cocinar o ayudar con una comida', icon: '🍳', points: 4 },
        { text: 'Sacar la basura cuando toca', icon: '🗑️', points: 2 },
      ],
    },
    {
      id: 'preteen_wellbeing',
      name: 'Bienestar y autocuidado',
      description: 'Hábitos que te van a servir toda la vida',
      icon: '🌱',
      points: 2,
      steps: [
        { text: '30 min de actividad física', icon: '⚽', points: 3 },
        { text: 'Tiempo sin pantallas (1 hora)', icon: '📵', points: 3 },
        { text: 'Hablar con alguien de la familia', icon: '💬', points: 2 },
        { text: 'Escribir 3 cosas buenas del día', icon: '📝', points: 2 },
      ],
    },
  ],
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
// SYNC: helpers para gestionar el código de familia
// ============================================================================

export const FAMILY_CODE_KEY = 'familyCode';
export const FAMILY_PIN_KEY_PREFIX = 'familyPin_';

export const getStoredFamilyPin = (familyCode) => {
  return localStorage.getItem(STORAGE_PREFIX + FAMILY_PIN_KEY_PREFIX + familyCode) || null;
};

export const setStoredFamilyPin = (familyCode, pin) => {
  localStorage.setItem(STORAGE_PREFIX + FAMILY_PIN_KEY_PREFIX + familyCode, pin);
  localStorage.setItem(ADMIN_PIN_KEY, pin);
};

export const packStateForSync = (state) => ({
  config: state.config,
  tasks: state.tasks || [],
  routines: state.routines || {},
  bigJobs: state.bigJobs || [],
  events: state.events || [],
  lists: state.lists || [],
  points: state.points || {},
  money: state.money || {},
  history: state.history || [],
  jobInstances: state.jobInstances || [],
  pinHash: state.pinHash || null,
});

// ============================================================================
// NORMALIZACIÓN
// ============================================================================

export const normalizeConfig = (config) => {
  const c = config || {};
  return {
    bonusPct: DEFAULT_BONUS_PCT,
    ...c,
    adults:  Array.isArray(c.adults)  ? c.adults  : [],
    kids:    Array.isArray(c.kids)    ? c.kids    : [],
    helpers: Array.isArray(c.helpers) ? c.helpers : [],
    pets:    Array.isArray(c.pets)    ? c.pets    : [],
  };
};

const normalizeList = (list) => ({
  ...list,
  items: Array.isArray(list?.items) ? list.items : [],
});

const normalizeRoutines = (routines) => {
  if (!routines || typeof routines !== 'object') return {};
  const out = {};
  Object.keys(routines).forEach(memberId => {
    out[memberId] = Array.isArray(routines[memberId]) ? routines[memberId] : [];
  });
  return out;
};

export const normalizeFamilyData = (raw) => {
  const data = raw || {};
  return {
    config:       normalizeConfig(data.config),
    tasks:        Array.isArray(data.tasks)        ? data.tasks        : [],
    bigJobs:      Array.isArray(data.bigJobs)      ? data.bigJobs      : [],
    events:       Array.isArray(data.events)       ? data.events       : [],
    lists:        Array.isArray(data.lists)        ? data.lists.map(normalizeList) : [],
    history:      Array.isArray(data.history)      ? data.history      : [],
    jobInstances: Array.isArray(data.jobInstances) ? data.jobInstances : [],
    routines:     normalizeRoutines(data.routines),
    points:       (data.points && typeof data.points === 'object') ? data.points : {},
    money:        (data.money  && typeof data.money  === 'object') ? data.money  : {},
    pinHash:      data.pinHash || null,
    updatedAt:    data.updatedAt || null,
  };
};

// ============================================================================
// ESTRUCTURA INICIAL VACÍA
// ============================================================================

export const INITIAL_TASKS = [];
export const INITIAL_VERO_TASKS = [];
export const INITIAL_ROUTINES = {};
export const INITIAL_JOBS = [];
export const INITIAL_EVENTS = [];
export const INITIAL_LISTS = [];
export const FAMILY = {};

export const buildFamilyFromOnboarding = (data) => {
  const family = {};
  (data.adults || []).forEach((adult) => {
    family[adult.id] = {
      name: adult.name,
      initial: adult.name.charAt(0).toUpperCase(),
      color: adult.color,
      isAdmin: true,
      role: 'adult',
    };
  });
  (data.kids || []).forEach((kid) => {
    family[kid.id] = {
      name: kid.name,
      initial: kid.name.charAt(0).toUpperCase(),
      color: kid.color,
      isAdmin: false,
      role: kid.young ? 'youngKid' : 'kid',
      young: !!kid.young,
    };
  });
  (data.helpers || []).forEach((helper) => {
    family[helper.id] = {
      name: helper.name,
      initial: helper.name.charAt(0).toUpperCase(),
      color: helper.color,
      isAdmin: false,
      role: 'helper',
    };
  });
  (data.pets || []).forEach((pet) => {
    family[pet.id] = {
      name: pet.name,
      initial: pet.name.charAt(0).toUpperCase(),
      color: pet.color,
      isAdmin: false,
      role: 'pet',
      petType: pet.petType,
      emoji: getPetEmoji(pet.petType),
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

// ============================================================================
// HELPERS PARA EDITAR FAMILIA
// ============================================================================

export const generateMemberId = (type, existingConfig) => {
  const list = type === 'adult' ? (existingConfig.adults || [])
              : type === 'kid'   ? (existingConfig.kids || [])
              : type === 'pet'   ? (existingConfig.pets || [])
              : (existingConfig.helpers || []);
  let i = 1;
  while (list.some(m => m.id === `${type}${i}`)) i++;
  return `${type}${i}`;
};

export const getUsedColors = (config) => {
  return [
    ...(config.adults  || []),
    ...(config.kids    || []),
    ...(config.helpers || []),
    ...(config.pets    || []),
  ].map(p => p.color);
};