// ============================================================================
// TIZTRIP — utilidades
// ============================================================================

export const TRIP_CODE_KEY = 'benditoviaje_trip_code';
export const MEMBER_KEY = 'benditoviaje_member';
export const NOTIF_KEY = 'benditoviaje_notif';
export const FIRED_KEY = 'benditoviaje_fired';
export const SEEN_EVENTS_KEY = 'benditoviaje_seen_events';

export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const CATEGORIES = [
  { id: 'vuelo',     label: 'Vuelo',      emoji: '✈️', color: '#5B96B0' },
  { id: 'traslado',  label: 'Traslado',   emoji: '🚌', color: '#C49B6C' },
  { id: 'hotel',     label: 'Alojamiento', emoji: '🏨', color: '#9B7FB8' },
  { id: 'actividad', label: 'Actividad',  emoji: '🎟️', color: '#E8804F' },
  { id: 'comida',    label: 'Comida',     emoji: '🍽️', color: '#E87A93' },
  { id: 'evento',    label: 'Evento',     emoji: '🎭', color: '#52A88A' },
  { id: 'otro',      label: 'Otro',       emoji: '📌', color: '#7BA05B' },
];

export const getCategory = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const MEMBER_COLORS = ['#E8804F', '#5B96B0', '#7BA05B', '#E87A93', '#9B7FB8', '#F5B645', '#52A88A', '#C49B6C', '#C0392B', '#F09872'];

export const TRIP_EMOJIS = ['✈️', '🏖️', '🏔️', '🗺️', '🌎', '🚢', '🏕️', '🎒', '🌴', '❄️', '🏰', '🚗'];

export const ALERT_OPTIONS = [
  { value: 0, label: 'Sin alerta' },
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 180, label: '3 horas antes' },
];

// ============================================================================
// FECHAS
// ============================================================================

export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => dateKey(new Date());

export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

// Lista de claves de fecha entre start y end inclusive (tope de seguridad: 90 días)
export const dateRange = (startKey, endKey) => {
  const out = [];
  const d = parseKey(startKey);
  const end = parseKey(endKey);
  let guard = 0;
  while (d <= end && guard < 90) {
    out.push(dateKey(d));
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return out;
};

export const formatDayLabel = (key) => {
  const d = parseKey(key);
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getMonth()]}`;
};

export const formatDayShort = (key) => {
  const d = parseKey(key);
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

export const formatTime = (time) => time || '';

// Date completo (con hora) de un evento
export const eventDateTime = (event) => {
  if (!event.date) return null;
  const d = parseKey(event.date);
  if (event.time) {
    const [h, m] = event.time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
};

// ============================================================================
// STORAGE LOCAL
// ============================================================================

export const loadState = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* sin espacio o modo privado: seguimos sin persistir */ }
};

export const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================================================
// FOTOS — compresión en el cliente para guardar en RTDB
// ============================================================================

export const compressImage = (file, maxDim = 1100, quality = 0.72) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no soportado'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// NOTIFICACIONES
// ============================================================================

export const notificationsSupported = () => 'Notification' in window;

export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

export const showNotification = async (title, body, tag) => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const options = {
    body,
    tag,
    icon: '/tiztrip-icon.svg',
    badge: '/tiztrip-icon.svg',
    lang: 'es-AR',
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch { /* caemos al constructor clásico */ }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
};

// Marca de notificaciones ya disparadas en este dispositivo (con limpieza de viejas)
export const getFired = () => loadState(FIRED_KEY, {});

export const markFired = (key) => {
  const fired = getFired();
  fired[key] = Date.now();
  const cutoff = Date.now() - 7 * 86400000;
  Object.keys(fired).forEach(k => { if (fired[k] < cutoff) delete fired[k]; });
  saveState(FIRED_KEY, fired);
};
