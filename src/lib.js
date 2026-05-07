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
// MOMENTOS DEL DÍA
// ============================================================================

export const TIME_OF_DAY = [
  { id: 'morning',   label: 'Mañana', emoji: '🌅', hours: [5, 12] },
  { id: 'afternoon', label: 'Tarde',  emoji: '☀️', hours: [12, 19] },
  { id: 'evening',   label: 'Noche',  emoji: '🌙', hours: [19, 29] },
];

export const getTimeOfDayInfo = (id) => TIME_OF_DAY.find(t => t.id === id) || { id: 'any', label: 'Cualquiera', emoji: '⏱️' };

export const getCurrentTimeOfDay = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 19) return 'afternoon';
  return 'evening';
};

// ============================================================================
// CATÁLOGO DE PLATOS
// ============================================================================

export const MEAL_CATALOG = [
  { id: 'milanesa_carne', name: 'Milanesa de carne', category: 'Carnes', tags: ['red_meat','fried','kids_friendly'], emoji: '🥩' },
  { id: 'asado',          name: 'Asado',             category: 'Carnes', tags: ['red_meat'], emoji: '🥩' },
  { id: 'bife_pure',      name: 'Bife con puré',     category: 'Carnes', tags: ['red_meat','kids_friendly'], emoji: '🥩' },
  { id: 'pastel_papa',    name: 'Pastel de papa',    category: 'Carnes', tags: ['red_meat','kids_friendly'], emoji: '🥧' },
  { id: 'albondigas',     name: 'Albóndigas',        category: 'Carnes', tags: ['red_meat','kids_friendly'], emoji: '🍝' },
  { id: 'guiso_lentejas', name: 'Guiso de lentejas', category: 'Guisos', tags: ['red_meat','soup'], emoji: '🥘' },
  { id: 'estofado',       name: 'Estofado',          category: 'Guisos', tags: ['red_meat','soup'], emoji: '🥘' },
  { id: 'matambre_napo',  name: 'Matambre a la napolitana', category: 'Carnes', tags: ['red_meat'], emoji: '🥩' },
  { id: 'empanadas_carne',name: 'Empanadas de carne',category: 'Empanadas', tags: ['red_meat','fried'], emoji: '🥟' },
  { id: 'hamburguesa',    name: 'Hamburguesas caseras', category: 'Carnes', tags: ['red_meat','kids_friendly'], emoji: '🍔' },
  { id: 'milanesa_pollo', name: 'Milanesa de pollo', category: 'Pollo', tags: ['white_meat','fried','kids_friendly'], emoji: '🍗' },
  { id: 'pollo_papas',    name: 'Pollo al horno con papas', category: 'Pollo', tags: ['white_meat','kids_friendly'], emoji: '🍗' },
  { id: 'pollo_arroz',    name: 'Pollo con arroz',   category: 'Pollo', tags: ['white_meat','kids_friendly'], emoji: '🍗' },
  { id: 'suprema',        name: 'Suprema de pollo',  category: 'Pollo', tags: ['white_meat','fried','kids_friendly'], emoji: '🍗' },
  { id: 'pollo_limon',    name: 'Pollo al limón',    category: 'Pollo', tags: ['white_meat','light'], emoji: '🍗' },
  { id: 'pollo_curry',    name: 'Pollo al curry',    category: 'Pollo', tags: ['white_meat'], emoji: '🍗' },
  { id: 'cerdo_pure',     name: 'Bondiola de cerdo', category: 'Cerdo', tags: ['white_meat'], emoji: '🥩' },
  { id: 'empanadas_pollo',name: 'Empanadas de pollo',category: 'Empanadas', tags: ['white_meat','fried'], emoji: '🥟' },
  { id: 'merluza_pure',   name: 'Merluza con puré',  category: 'Pescados', tags: ['fish','light','kids_friendly'], emoji: '🐟' },
  { id: 'salmon_horno',   name: 'Salmón al horno',   category: 'Pescados', tags: ['fish','light'], emoji: '🐟' },
  { id: 'atun_pasta',     name: 'Pasta con atún',    category: 'Pescados', tags: ['fish','pasta'], emoji: '🍝' },
  { id: 'rabas',          name: 'Rabas',             category: 'Pescados', tags: ['fish','fried'], emoji: '🦑' },
  { id: 'milanesa_pesca', name: 'Milanesa de pescado', category: 'Pescados', tags: ['fish','fried','kids_friendly'], emoji: '🐟' },
  { id: 'tallarines',     name: 'Tallarines con tuco',category: 'Pastas', tags: ['pasta','kids_friendly'], emoji: '🍝' },
  { id: 'fideos_filetto', name: 'Fideos al filetto', category: 'Pastas', tags: ['pasta','vegetarian','kids_friendly'], emoji: '🍝' },
  { id: 'sorrentinos',    name: 'Sorrentinos',       category: 'Pastas', tags: ['pasta','kids_friendly'], emoji: '🥟' },
  { id: 'ravioles',       name: 'Ravioles',          category: 'Pastas', tags: ['pasta','kids_friendly'], emoji: '🥟' },
  { id: 'noquis',         name: 'Ñoquis',            category: 'Pastas', tags: ['pasta','vegetarian','kids_friendly'], emoji: '🥔' },
  { id: 'lasagna',        name: 'Lasaña',            category: 'Pastas', tags: ['pasta','red_meat'], emoji: '🍝' },
  { id: 'canelones',      name: 'Canelones',         category: 'Pastas', tags: ['pasta'], emoji: '🍝' },
  { id: 'fideos_manteca', name: 'Fideos con manteca',category: 'Pastas', tags: ['pasta','vegetarian','kids_friendly'], emoji: '🍝' },
  { id: 'spaghetti_carbo',name: 'Spaghetti carbonara',category: 'Pastas', tags: ['pasta','white_meat'], emoji: '🍝' },
  { id: 'tarta_verdura',  name: 'Tarta de verdura',  category: 'Vegetarianos', tags: ['vegetarian'], emoji: '🥧' },
  { id: 'tarta_choclo',   name: 'Tarta de choclo',   category: 'Vegetarianos', tags: ['vegetarian','kids_friendly'], emoji: '🥧' },
  { id: 'pizza_casera',   name: 'Pizza casera',      category: 'Vegetarianos', tags: ['vegetarian','kids_friendly'], emoji: '🍕' },
  { id: 'tortilla_papa',  name: 'Tortilla de papa',  category: 'Vegetarianos', tags: ['vegetarian','kids_friendly'], emoji: '🍳' },
  { id: 'revuelto_gramaj',name: 'Revuelto Gramajo',  category: 'Vegetarianos', tags: ['white_meat'], emoji: '🍳' },
  { id: 'sopa_verduras',  name: 'Sopa de verduras',  category: 'Sopas', tags: ['vegetarian','soup','light'], emoji: '🍲' },
  { id: 'crema_calabaza', name: 'Crema de calabaza', category: 'Sopas', tags: ['vegetarian','soup','light'], emoji: '🥣' },
  { id: 'berenjena_napo', name: 'Berenjena a la napolitana', category: 'Vegetarianos', tags: ['vegetarian'], emoji: '🍆' },
  { id: 'zapallitos_rell',name: 'Zapallitos rellenos',category: 'Vegetarianos', tags: ['vegetarian'], emoji: '🥒' },
  { id: 'budin_zucchini', name: 'Budín de zucchini', category: 'Vegetarianos', tags: ['vegetarian','light'], emoji: '🥒' },
  { id: 'risotto',        name: 'Risotto',           category: 'Vegetarianos', tags: ['vegetarian'], emoji: '🍚' },
  { id: 'arroz_integral', name: 'Arroz integral con verduras', category: 'Vegetarianos', tags: ['vegetarian','light'], emoji: '🍚' },
  { id: 'wok_verduras',   name: 'Wok de verduras',   category: 'Vegetarianos', tags: ['vegetarian','light'], emoji: '🥢' },
  { id: 'ensalada_completa', name: 'Ensalada completa', category: 'Ensaladas', tags: ['salad','light','vegetarian'], emoji: '🥗' },
  { id: 'ensalada_caesar',name: 'Ensalada César',    category: 'Ensaladas', tags: ['salad','light','white_meat'], emoji: '🥗' },
  { id: 'ensalada_pollo', name: 'Ensalada con pollo',category: 'Ensaladas', tags: ['salad','light','white_meat'], emoji: '🥗' },
  { id: 'wrap_pollo',     name: 'Wrap de pollo',     category: 'Otros', tags: ['white_meat','light'], emoji: '🌯' },
  { id: 'locro',          name: 'Locro',             category: 'Tradicionales', tags: ['red_meat','soup'], emoji: '🍲' },
  { id: 'humita',         name: 'Humita en chala',   category: 'Tradicionales', tags: ['vegetarian'], emoji: '🌽' },
  { id: 'choripan',       name: 'Choripán',          category: 'Tradicionales', tags: ['red_meat','kids_friendly'], emoji: '🌭' },
  { id: 'puchero',        name: 'Puchero',           category: 'Tradicionales', tags: ['red_meat','soup'], emoji: '🍲' },
  { id: 'pancho',         name: 'Panchos',           category: 'Rápidas', tags: ['red_meat','kids_friendly','fried'], emoji: '🌭' },
  { id: 'sandwich_milan', name: 'Sándwich de milanesa', category: 'Rápidas', tags: ['red_meat','kids_friendly'], emoji: '🥪' },
  { id: 'tostones',       name: 'Tostones / sándwiches caliente', category: 'Rápidas', tags: ['vegetarian','kids_friendly'], emoji: '🥪' },
  { id: 'pizza_delivery', name: 'Pizza (delivery)',  category: 'Rápidas', tags: ['vegetarian','kids_friendly'], emoji: '🍕' },
  { id: 'empanadas_var',  name: 'Empanadas variadas',category: 'Empanadas', tags: ['fried'], emoji: '🥟' },
];

export const MEAL_BALANCE_CATEGORIES = [
  { id: 'red_meat',   label: 'Carnes rojas',   color: '#C0392B', suggested: 3 },
  { id: 'white_meat', label: 'Pollo / cerdo',  color: '#E8804F', suggested: 3 },
  { id: 'fish',       label: 'Pescados',       color: '#5B96B0', suggested: 2 },
  { id: 'pasta',      label: 'Pastas',         color: '#F5B645', suggested: 2 },
  { id: 'vegetarian', label: 'Vegetarianos',   color: '#7BA05B', suggested: 3 },
  { id: 'fried',      label: 'Frituras',       color: '#9B7FB8', suggested: 2, isLimit: true },
];

export const mealBalanceCategories = (meal) => {
  if (!meal || !meal.tags) return [];
  const cats = [];
  if (meal.tags.includes('red_meat'))   cats.push('red_meat');
  if (meal.tags.includes('white_meat')) cats.push('white_meat');
  if (meal.tags.includes('fish'))       cats.push('fish');
  if (meal.tags.includes('pasta'))      cats.push('pasta');
  if (meal.tags.includes('vegetarian') && !meal.tags.includes('red_meat') && !meal.tags.includes('white_meat') && !meal.tags.includes('fish')) {
    cats.push('vegetarian');
  }
  if (meal.tags.includes('fried'))      cats.push('fried');
  return cats;
};

export const getMealById = (id) => MEAL_CATALOG.find(m => m.id === id);

// ============================================================================
// PREMIOS - sugerencias por defecto
// ============================================================================

export const REWARD_SUGGESTIONS = [
  { name: '30 min de pantallas extra', icon: '📱', cost: 30, type: 'points' },
  { name: '1 hora de juego elegido', icon: '🎮', cost: 50, type: 'points' },
  { name: 'Postre extra', icon: '🍦', cost: 20, type: 'points' },
  { name: 'Elegir película familiar', icon: '🎬', cost: 40, type: 'points' },
  { name: 'Salida a la plaza', icon: '🌳', cost: 60, type: 'points' },
  { name: 'Quedarse despierto 30 min más', icon: '🌙', cost: 50, type: 'points' },
  { name: 'Comida favorita del día', icon: '🍕', cost: 80, type: 'points' },
  { name: 'Salida al cine', icon: '🎟️', cost: 200, type: 'points' },
  { name: 'Helado en la heladería', icon: '🍨', cost: 100, type: 'points' },
  { name: 'Día sin tareas de casa', icon: '🛌', cost: 150, type: 'points' },
];

export const REWARD_ICONS = ['🎮','📱','🎬','🍦','🍕','🍨','🌳','🎟️','🛌','🎁','⭐','💰','🍰','🎈','🎨','📚','🚲','🎸','🎲','🍿'];

// ============================================================================
// TEMPLATES DE RUTINAS
// ============================================================================

export const ROUTINE_TEMPLATES = {
  young: [
    { id: 'young_morning', name: 'Mañana de los chiquitos', description: 'Para empezar el día con todo listo', icon: '🌅', timeOfDay: 'morning',
      steps: [
        { label: 'Levantarme', icon: '🛏️', points: 1 },
        { label: 'Hacer pis', icon: '🚽', points: 1 },
        { label: 'Vestirme', icon: '👕', points: 1 },
        { label: 'Desayunar', icon: '🥣', points: 1 },
        { label: 'Lavarme los dientes', icon: '🪥', points: 1 },
      ],
    },
    { id: 'young_night', name: 'Antes de dormir', description: 'Rutina de la noche, pasos simples', icon: '🌙', timeOfDay: 'evening',
      steps: [
        { label: 'Bañarme', icon: '🚿', points: 1 },
        { label: 'Pijama', icon: '👕', points: 1 },
        { label: 'Lavarme los dientes', icon: '🪥', points: 1 },
        { label: 'Cuento o canción', icon: '📚', points: 1 },
      ],
    },
    { id: 'young_meals', name: 'En la mesa', description: 'Cosas que hacemos al comer', icon: '🍽️', timeOfDay: 'any',
      steps: [
        { label: 'Lavarme las manos', icon: '🧼', points: 1 },
        { label: 'Sentarme bien', icon: '🪑', points: 1 },
        { label: 'Comer todo', icon: '🍽️', points: 2 },
        { label: 'Llevar el plato', icon: '🍴', points: 1 },
      ],
    },
  ],
  kid: [
    { id: 'kid_morning', name: 'Mañana de cole', description: 'Todo lo que hace falta antes de salir', icon: '🎒', timeOfDay: 'morning',
      steps: [
        { text: 'Levantarme con la primera alarma', icon: '⏰', points: 2 },
        { text: 'Hacer la cama', icon: '🛏️', points: 1 },
        { text: 'Vestirme con el uniforme', icon: '👕', points: 1 },
        { text: 'Desayunar tranquilo', icon: '🥣', points: 1 },
        { text: 'Lavarme los dientes', icon: '🪥', points: 1 },
        { text: 'Revisar la mochila', icon: '🎒', points: 2 },
      ],
    },
    { id: 'kid_homework', name: 'Tarea y estudio', description: 'Después del cole', icon: '📚', timeOfDay: 'afternoon',
      steps: [
        { text: 'Sacar la merienda y comer', icon: '🍎', points: 1 },
        { text: 'Revisar agenda escolar', icon: '📓', points: 1 },
        { text: 'Hacer la tarea', icon: '✏️', points: 3 },
        { text: 'Guardar útiles en la mochila', icon: '🎒', points: 1 },
      ],
    },
    { id: 'kid_night', name: 'Rutina de noche', description: 'Para llegar bien a la cama', icon: '🌙', timeOfDay: 'evening',
      steps: [
        { text: 'Bañarme', icon: '🚿', points: 2 },
        { text: 'Ponerme el pijama', icon: '👕', points: 1 },
        { text: 'Lavarme los dientes', icon: '🪥', points: 1 },
        { text: 'Preparar lo del día siguiente', icon: '🎒', points: 1 },
        { text: 'Lectura 15 minutos', icon: '📖', points: 2 },
      ],
    },
    { id: 'kid_chores', name: 'Ayuda en casa', description: 'Tareas chicas para colaborar', icon: '🏠', timeOfDay: 'any',
      steps: [
        { text: 'Ordenar mi cuarto', icon: '🧸', points: 2 },
        { text: 'Poner la mesa', icon: '🍽️', points: 1 },
        { text: 'Levantar la mesa después de comer', icon: '🍴', points: 1 },
        { text: 'Sacar la ropa sucia al canasto', icon: '🧺', points: 1 },
      ],
    },
    { id: 'kid_health', name: 'Hábitos saludables', description: 'Pequeñas cosas que suman a largo plazo', icon: '💪', timeOfDay: 'any',
      steps: [
        { text: 'Tomar al menos 4 vasos de agua', icon: '💧', points: 2 },
        { text: 'Comer una fruta', icon: '🍎', points: 1 },
        { text: 'Moverme o jugar afuera 30 min', icon: '⚽', points: 2 },
        { text: 'Estar sin pantallas en la mesa', icon: '📵', points: 2 },
      ],
    },
  ],
  preteen: [
    { id: 'preteen_morning', name: 'Mañana autogestionada', description: 'Empezar el día sin que nadie te avise', icon: '🌅', timeOfDay: 'morning',
      steps: [
        { text: 'Despertarme con mi propia alarma', icon: '⏰', points: 3 },
        { text: 'Hacer la cama', icon: '🛏️', points: 1 },
        { text: 'Higiene completa (cara, dientes, peinarme)', icon: '🪥', points: 2 },
        { text: 'Vestirme apropiado para el día', icon: '👕', points: 1 },
        { text: 'Desayunar y lavar lo que usé', icon: '🥣', points: 2 },
        { text: 'Tener todo listo 10 min antes de salir', icon: '🎒', points: 3 },
      ],
    },
    { id: 'preteen_study', name: 'Estudio y responsabilidades', description: 'Para la tarde, después del colegio', icon: '📚', timeOfDay: 'afternoon',
      steps: [
        { text: 'Revisar tareas y exámenes próximos', icon: '📅', points: 2 },
        { text: 'Hacer la tarea con concentración', icon: '✏️', points: 4 },
        { text: 'Repasar 20 minutos lo que vi en clase', icon: '📖', points: 3 },
        { text: 'Organizar la mochila para mañana', icon: '🎒', points: 1 },
      ],
    },
    { id: 'preteen_night', name: 'Cierre del día', description: 'Para descansar bien', icon: '🌙', timeOfDay: 'evening',
      steps: [
        { text: 'Dejar el celular a cargar fuera del cuarto', icon: '📱', points: 3 },
        { text: 'Ducha o higiene de noche', icon: '🚿', points: 2 },
        { text: 'Lectura o algo tranquilo 20 min', icon: '📖', points: 2 },
        { text: 'Dormir antes de las 22:30', icon: '😴', points: 3 },
      ],
    },
    { id: 'preteen_independence', name: 'Autonomía en casa', description: 'Tareas para colaborar como adolescente', icon: '🏠', timeOfDay: 'any',
      steps: [
        { text: 'Mantener mi cuarto ordenado', icon: '🛏️', points: 2 },
        { text: 'Lavar mi ropa (o ayudar)', icon: '🧺', points: 3 },
        { text: 'Cocinar o ayudar con una comida', icon: '🍳', points: 4 },
        { text: 'Sacar la basura cuando toca', icon: '🗑️', points: 2 },
      ],
    },
    { id: 'preteen_wellbeing', name: 'Bienestar y autocuidado', description: 'Hábitos que te van a servir toda la vida', icon: '🌱', timeOfDay: 'any',
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

// Helpers para semana (lunes a domingo)
export const getMondayOf = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  return d;
};

export const getSundayOf = (date) => {
  const monday = getMondayOf(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return sunday;
};

export const isInWeekRange = (dateK, weekStart) => {
  const d = parseKey(dateK);
  const start = getMondayOf(weekStart);
  const end = getSundayOf(weekStart);
  return d >= start && d <= end;
};

export const isInMonthRange = (dateK, monthStart) => {
  const d = parseKey(dateK);
  return d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth();
};

export const formatWeekRange = (mondayDate) => {
  const monday = getMondayOf(mondayDate);
  const sunday = getSundayOf(mondayDate);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  if (sameMonth) {
    return `${monday.getDate()} - ${sunday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} ${sunday.getFullYear()}`;
  }
  return `${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} - ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]} ${sunday.getFullYear()}`;
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

export const FAMILY_CODE_KEY = 'familyCode';
export const FAMILY_PIN_KEY_PREFIX = 'familyPin_';

export const getStoredFamilyPin = (familyCode) => {
  return localStorage.getItem(STORAGE_PREFIX + FAMILY_PIN_KEY_PREFIX + familyCode) || null;
};

export const setStoredFamilyPin = (familyCode, pin) => {
  localStorage.setItem(STORAGE_PREFIX + FAMILY_PIN_KEY_PREFIX + familyCode, pin);
  localStorage.setItem(ADMIN_PIN_KEY, pin);
};

// ============================================================================
// NORMALIZACIÓN
// ============================================================================

export const normalizeConfig = (config) => {
  const c = config || {};
  return {
    bonusPct: DEFAULT_BONUS_PCT,
    showMealBalance: true,
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
    config:        normalizeConfig(data.config),
    tasks:         Array.isArray(data.tasks)         ? data.tasks         : [],
    bigJobs:       Array.isArray(data.bigJobs)       ? data.bigJobs       : [],
    events:        Array.isArray(data.events)        ? data.events        : [],
    lists:         Array.isArray(data.lists)         ? data.lists.map(normalizeList) : [],
    history:       Array.isArray(data.history)       ? data.history       : [],
    jobInstances:  Array.isArray(data.jobInstances)  ? data.jobInstances  : [],
    rewards:       Array.isArray(data.rewards)       ? data.rewards       : [],
    rewardClaims:  Array.isArray(data.rewardClaims)  ? data.rewardClaims  : [],
    routines:      normalizeRoutines(data.routines),
    points:        (data.points && typeof data.points === 'object') ? data.points : {},
    money:         (data.money  && typeof data.money  === 'object') ? data.money  : {},
    meals:         (data.meals  && typeof data.meals  === 'object') ? data.meals  : {},
    streaks:       (data.streaks && typeof data.streaks === 'object') ? data.streaks : {},
    pinHash:       data.pinHash || null,
    updatedAt:     data.updatedAt || null,
  };
};

// ============================================================================
// FAMILIA
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
    family[adult.id] = { name: adult.name, initial: adult.name.charAt(0).toUpperCase(), color: adult.color, isAdmin: true, role: 'adult' };
  });
  (data.kids || []).forEach((kid) => {
    family[kid.id] = { name: kid.name, initial: kid.name.charAt(0).toUpperCase(), color: kid.color, isAdmin: false, role: kid.young ? 'youngKid' : 'kid', young: !!kid.young };
  });
  (data.helpers || []).forEach((helper) => {
    family[helper.id] = { name: helper.name, initial: helper.name.charAt(0).toUpperCase(), color: helper.color, isAdmin: false, role: 'helper' };
  });
  (data.pets || []).forEach((pet) => {
    family[pet.id] = { name: pet.name, initial: pet.name.charAt(0).toUpperCase(), color: pet.color, isAdmin: false, role: 'pet', petType: pet.petType, emoji: getPetEmoji(pet.petType) };
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
        } catch { resolve({ lat: latitude, lon: longitude, name: 'Tu zona' }); }
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
    return { temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode };
  } catch { return null; }
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

export const formatTime = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true });

export const formatDate = (d) => `${DAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;

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

// ============================================================================
// HELPER STREAKS (rachas)
// ============================================================================
// streaks[kidId] = { current: N, last: 'YYYY-MM-DD', best: M }
// 'current' = racha actual de días consecutivos completos
// 'last' = último día YYYY-MM-DD que sumó a la racha
// 'best' = récord histórico

export const updateStreakForKid = (streaks, kidId, completedToday, todayK) => {
  const newStreaks = { ...streaks };
  const current = newStreaks[kidId] || { current: 0, last: null, best: 0 };
  let newCurrent = current.current;
  let newLast = current.last;

  if (completedToday) {
    if (current.last === todayK) return newStreaks; // ya contado
    if (!current.last) {
      newCurrent = 1;
      newLast = todayK;
    } else {
      const lastDate = parseKey(current.last);
      const todayDate = parseKey(todayK);
      const diff = daysBetween(lastDate, todayDate);
      if (diff === 1) {
        newCurrent = current.current + 1;
        newLast = todayK;
      } else if (diff === 0) {
        return newStreaks;
      } else {
        newCurrent = 1;
        newLast = todayK;
      }
    }
  } else {
    // destildó algo y la racha se contabilizó hoy
    if (current.last === todayK) {
      newCurrent = Math.max(0, current.current - 1);
      if (newCurrent > 0) {
        const yesterday = new Date(parseKey(todayK));
        yesterday.setDate(yesterday.getDate() - 1);
        newLast = dateKey(yesterday);
      } else {
        newLast = null;
      }
    }
  }

  const newBest = Math.max(current.best || 0, newCurrent);
  newStreaks[kidId] = { current: newCurrent, last: newLast, best: newBest };
  return newStreaks;
};

// Devuelve la racha actual "viva" de un kid considerando si rompió o no.
// Si su last no es hoy ni ayer, la racha actual cuenta como 0 (rota).
export const getLiveStreak = (streaks, kidId) => {
  const s = streaks[kidId] || { current: 0, last: null, best: 0 };
  if (!s.last) return { current: 0, best: s.best || 0 };
  const last = parseKey(s.last);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = daysBetween(last, today);
  if (diff > 1) return { current: 0, best: s.best || 0 };
  return { current: s.current || 0, best: s.best || 0 };
};

// Para una rutina o tarea (puede tener `who` o `whoIds`)
export const itemAppliesTo = (item, memberId) => {
  if (Array.isArray(item.whoIds)) return item.whoIds.includes(memberId);
  return item.who === memberId;
};

export const itemMembers = (item) => {
  if (Array.isArray(item.whoIds)) return item.whoIds;
  if (item.who) return [item.who];
  return [];
};

export const isSharedItem = (item) => Array.isArray(item.whoIds) && item.whoIds.length > 1;

export const getRoutineTimeOfDay = (r) => r.timeOfDay || 'any';