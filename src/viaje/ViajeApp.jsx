import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar, Image as ImageIcon, Users, Plus, X, Trash2, Edit2, Check,
  Copy, Share2, Bell, BellOff, MapPin, Clock, Camera,
  Wifi, WifiOff, LogOut, Sparkles, StickyNote, KeyRound,
} from 'lucide-react';
import {
  TRIP_CODE_KEY, MEMBER_KEY, SEEN_EVENTS_KEY,
  CATEGORIES, getCategory, MEMBER_COLORS, TRIP_EMOJIS, ALERT_OPTIONS,
  todayKey, daysBetween, dateRange, formatDayLabel, formatDayShort,
  eventDateTime, loadState, saveState, generateId, compressImage,
  notificationsSupported, requestNotificationPermission, showNotification,
  getFired, markFired,
} from './lib.js';
import {
  generateTripCode, subscribeTripData, saveTripNode, removeTripNode, checkTripCodeExists,
} from '../firebase.js';
import { SEED_PARIS, SEED_TRIP_CODE } from './seedParis.js';

// ============================================================================
// RAÍZ
// ============================================================================

export default function ViajeApp() {
  const [tripCode, setTripCode] = useState(() => loadState(TRIP_CODE_KEY, null));
  const [member, setMember] = useState(() => loadState(MEMBER_KEY, null));
  const [trip, setTrip] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting');

  useEffect(() => {
    if (!tripCode) return;
    const unsubscribe = subscribeTripData(tripCode, (data) => {
      setTrip(data || { empty: true });
      setSyncStatus('connected');
    }, (error) => {
      setSyncStatus(`error:${error?.code || error?.message || 'desconocido'}`);
    });
    return () => { try { unsubscribe(); } catch { /* ya desuscripto */ } };
  }, [tripCode]);

  const handleCreateTrip = () => {
    const newCode = generateTripCode();
    saveState(TRIP_CODE_KEY, newCode);
    setTripCode(newCode);
  };

  const handleJoinTrip = async (code) => {
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode || cleanCode.length < 4) {
      alert('Ingresá un código válido');
      return false;
    }
    const exists = await checkTripCodeExists(cleanCode);
    if (!exists && cleanCode !== SEED_TRIP_CODE) {
      alert(`No encontramos un viaje con el código "${cleanCode}". Verificá que esté bien escrito.`);
      return false;
    }
    saveState(TRIP_CODE_KEY, cleanCode);
    setTripCode(cleanCode);
    return true;
  };

  const handleSetMember = async (name, color) => {
    const usedColors = Object.values(trip?.members || {}).map(m => m.color);
    const finalColor = color || MEMBER_COLORS.find(c => !usedColors.includes(c)) || MEMBER_COLORS[0];
    const newMember = { id: generateId(), name: name.trim(), color: finalColor, joinedAt: Date.now() };
    saveState(MEMBER_KEY, newMember);
    setMember(newMember);
    await saveTripNode(tripCode, `members/${newMember.id}`, newMember);
    return newMember;
  };

  const handleLeaveTrip = () => {
    if (!confirm('¿Salir de este viaje en este dispositivo? Los datos en la nube se conservan y podés volver a entrar con el código.')) return;
    Object.keys(localStorage).filter(k => k.startsWith('benditoviaje_')).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const handlePickMember = (m) => {
    saveState(MEMBER_KEY, m);
    setMember(m);
  };

  if (!tripCode) {
    return <WelcomeFlow onNew={handleCreateTrip} onJoin={handleJoinTrip} />;
  }

  if (!trip) {
    return <LoadingScreen error={syncStatus.startsWith('error:') ? syncStatus.slice(6) : null} onLeave={handleLeaveTrip} />;
  }

  if (trip.empty || !trip.config) {
    // El código fijo del plan precargado crea el viaje solo: nombre y adentro
    if (tripCode === SEED_TRIP_CODE) {
      return <JoinProfile
        trip={{ config: SEED_PARIS.config, members: trip.members || {} }}
        onLeave={handleLeaveTrip}
        onPick={handlePickMember}
        onSubmit={async (name, color) => {
          await saveTripNode(tripCode, 'config', { ...SEED_PARIS.config, createdAt: Date.now() });
          const newMember = await handleSetMember(name, color);
          for (const ev of SEED_PARIS.events) {
            const id = generateId();
            await saveTripNode(tripCode, `events/${id}`, {
              ...ev, id, photos: [], createdBy: newMember.id, createdAt: Date.now(), updatedAt: Date.now(),
            });
          }
        }}
      />;
    }
    return <TripSetup tripCode={tripCode} onLeave={handleLeaveTrip} onComplete={async (config, name, color, seedEvents) => {
      await saveTripNode(tripCode, 'config', config);
      const newMember = await handleSetMember(name, color);
      for (const ev of seedEvents || []) {
        const id = generateId();
        await saveTripNode(tripCode, `events/${id}`, {
          ...ev, id, photos: [], createdBy: newMember.id, createdAt: Date.now(), updatedAt: Date.now(),
        });
      }
    }} />;
  }

  if (!member) {
    return <JoinProfile trip={trip} onSubmit={(name, color) => handleSetMember(name, color)} onPick={handlePickMember} onLeave={handleLeaveTrip} />;
  }

  return (
    <MainApp
      tripCode={tripCode}
      trip={trip}
      member={member}
      syncStatus={syncStatus}
      onMemberChange={handlePickMember}
      onLeave={handleLeaveTrip}
    />
  );
}

// ============================================================================
// ESTILOS COMPARTIDOS
// ============================================================================

function SharedStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html, body { margin: 0; padding: 0; }
      body { background: #FDFAF3; }
      input, select, textarea, button { font-family: inherit; font-size: inherit; }
      input, select, textarea {
        width: 100%; padding: 12px 14px; border: 1.5px solid #E8DEC9; border-radius: 12px;
        background: #FBF5E9; color: #3D2E1F; outline: none; transition: border-color 0.15s, background 0.15s;
      }
      input:focus, select:focus, textarea:focus { border-color: #3D2E1F; background: #fff; }
      button { cursor: pointer; border: none; }
      @keyframes vj-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes vj-fadein { from { opacity: 0; } to { opacity: 1; } }
      @keyframes vj-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      .vj-card { animation: vj-fadeup 0.25s ease both; }
      .vj-overlay { animation: vj-fadein 0.18s ease both; }
      .vj-press:active { transform: scale(0.97); }
      ::-webkit-scrollbar { width: 0; height: 0; }
    `}</style>
  );
}

const FONT = '"DM Sans", -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = '"Fraunces", Georgia, serif';
const INK = '#3D2E1F';
const INK_SOFT = '#8A7560';
const ACCENT = '#E8804F';
const BG = '#FDFAF3';
const CARD_SHADOW = '0 2px 12px rgba(61, 46, 31, 0.08)';

const screenStyle = {
  minHeight: '100vh',
  background: BG,
  fontFamily: FONT,
  color: INK,
};

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      className="vj-press"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '15px', borderRadius: 14, fontWeight: 600, fontSize: 15,
        background: disabled ? '#D4C5B0' : INK,
        color: '#FDFAF3', boxShadow: disabled ? 'none' : '0 4px 14px rgba(61, 46, 31, 0.25)',
        transition: 'transform 0.1s', ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button
      className="vj-press"
      onClick={onClick}
      style={{
        width: '100%', padding: '14px', borderRadius: 14, fontWeight: 600, fontSize: 15,
        background: '#fff', color: INK, border: '2px solid #E8DEC9', transition: 'transform 0.1s', ...style,
      }}
    >
      {children}
    </button>
  );
}

// ============================================================================
// BIENVENIDA
// ============================================================================

function WelcomeFlow({ onNew, onJoin }) {
  const [mode, setMode] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitJoin = async () => {
    setLoading(true);
    const ok = await onJoin(code);
    setLoading(false);
    if (!ok) setCode('');
  };

  return (
    <div style={{ ...screenStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg, #FFF8EE 0%, #FDFAF3 50%, #FFE8D6 100%)' }}>
      <SharedStyles />
      <div className="vj-card" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>✈️</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.5 }}>TizTrip</h1>
        <p style={{ color: INK_SOFT, fontSize: 16, margin: '0 0 32px' }}>
          Itinerario, pasajes y actividades compartidas.<br />Con alertas en el teléfono de todos.
        </p>

        {mode === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PrimaryButton onClick={onNew}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Plus size={20} /> Crear un viaje nuevo</span>
            </PrimaryButton>
            <GhostButton onClick={() => setMode('join')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><KeyRound size={18} /> Tengo un código de viaje</span>
            </GhostButton>
          </div>
        )}

        {mode === 'join' && (
          <div className="vj-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            <label style={{ fontWeight: 600, fontSize: 14 }}>Código del viaje</label>
            <input
              autoFocus
              placeholder="ej: gran-aventura-2026"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitJoin()}
              style={{ textAlign: 'center', fontSize: 18, letterSpacing: 0.5 }}
            />
            <PrimaryButton onClick={handleSubmitJoin} disabled={loading}>
              {loading ? 'Buscando…' : 'Unirme al viaje'}
            </PrimaryButton>
            <GhostButton onClick={() => setMode(null)}>Volver</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ error, onLeave }) {
  const isPermission = /permission|denied/i.test(error || '');
  return (
    <div style={{ ...screenStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <SharedStyles />
      <div style={{ fontSize: 48, animation: error ? 'none' : 'vj-pulse 1.2s infinite' }}>{error ? '🛑' : '✈️'}</div>
      {!error && <p style={{ color: INK_SOFT }}>Cargando tu viaje…</p>}
      {error && (
        <>
          <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: 0 }}>No pudimos conectar con el viaje</p>
          <p style={{ color: INK_SOFT, fontSize: 14.5, margin: 0, maxWidth: 340 }}>
            {isPermission
              ? 'La base de datos rechazó el acceso. Hay que habilitar la ruta "trips" en las reglas de Firebase (Realtime Database → Reglas), igual que está "families".'
              : `Error: ${error}. Revisá la conexión a internet y probá de nuevo.`}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <PrimaryButton onClick={() => window.location.reload()} style={{ width: 'auto', padding: '13px 22px' }}>Reintentar</PrimaryButton>
            <GhostButton onClick={onLeave} style={{ width: 'auto', padding: '13px 22px' }}>Salir</GhostButton>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// CREAR VIAJE
// ============================================================================

function TripSetup({ tripCode, onComplete, onLeave }) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState('');
  const [myName, setMyName] = useState('');
  const [useSeed, setUseSeed] = useState(false);
  const [saving, setSaving] = useState(false);

  const applySeed = () => {
    setUseSeed(true);
    setName(SEED_PARIS.config.name);
    setDestination(SEED_PARIS.config.destination);
    setEmoji(SEED_PARIS.config.emoji);
    setStartDate(SEED_PARIS.config.startDate);
    setEndDate(SEED_PARIS.config.endDate);
  };

  const handleSave = async () => {
    if (!name.trim()) { alert('Poné un nombre al viaje'); return; }
    if (!myName.trim()) { alert('Poné tu nombre para que los demás sepan quién agrega cada cosa'); return; }
    if (!startDate) { alert('Elegí la fecha de inicio'); return; }
    const finalEnd = endDate && endDate >= startDate ? endDate : startDate;
    setSaving(true);
    await onComplete({
      name: name.trim(),
      destination: destination.trim(),
      emoji,
      startDate,
      endDate: finalEnd,
      createdAt: Date.now(),
    }, myName, null, useSeed ? SEED_PARIS.events : null);
  };

  return (
    <div style={{ ...screenStyle, padding: '32px 20px 40px' }}>
      <SharedStyles />
      <div className="vj-card" style={{ maxWidth: 460, margin: '0 auto' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 700, margin: '0 0 4px' }}>Armemos tu viaje</h1>
        <p style={{ color: INK_SOFT, margin: '0 0 24px', fontSize: 15 }}>
          Código del viaje: <b style={{ color: INK }}>{tripCode}</b> — compartilo después para sumar gente.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            className="vj-press"
            onClick={() => useSeed ? setUseSeed(false) : applySeed()}
            style={{
              textAlign: 'left', borderRadius: 14, padding: '13px 14px',
              background: useSeed ? '#FDEEDC' : '#fff',
              border: useSeed ? `2px solid ${ACCENT}` : '2px dashed #DFD3BC',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <div style={{ fontSize: 26 }}>🏰</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>
                {useSeed ? 'Plan París Julio 2026 ✓' : 'Usar plan París Julio 2026'}
              </div>
              <div style={{ fontSize: 12.5, color: INK_SOFT }}>
                {useSeed
                  ? `Se cargan ${SEED_PARIS.events.length} planes del itinerario de PHD Travel. Tocá para deshacer.`
                  : 'Precarga el itinerario completo: Sofitel, Versailles, Louvre, traslados y reservas.'}
              </div>
            </div>
          </button>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Nombre del viaje</label>
            <input placeholder="ej: Vacaciones en Brasil" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Destino (opcional)</label>
            <input placeholder="ej: Río de Janeiro" value={destination} onChange={e => setDestination(e.target.value)} />
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Ícono</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRIP_EMOJIS.map(e => (
                <button
                  key={e}
                  className="vj-press"
                  onClick={() => setEmoji(e)}
                  style={{
                    fontSize: 24, width: 46, height: 46, borderRadius: 12,
                    background: emoji === e ? '#FDEEDC' : '#fff',
                    border: emoji === e ? `2px solid ${ACCENT}` : '2px solid #E8DEC9',
                  }}
                >{e}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Salida</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Vuelta</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Tu nombre</label>
            <input placeholder="ej: Sebas" value={myName} onChange={e => setMyName(e.target.value)} />
          </div>

          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Creando…' : '¡Listo, empezar a cargar el plan!'}
          </PrimaryButton>
          <GhostButton onClick={onLeave} style={{ border: 'none', color: INK_SOFT, background: 'transparent' }}>Cancelar</GhostButton>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UNIRSE: ELEGIR NOMBRE Y COLOR
// ============================================================================

function JoinProfile({ trip, onSubmit, onPick, onLeave }) {
  const members = Object.values(trip.members || {}).sort((a, b) => a.joinedAt - b.joinedAt);
  const [mode, setMode] = useState(members.length > 0 ? 'pick' : 'new');
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(null);
  const usedColors = members.map(m => m.color);

  const handlePickExisting = (m) => {
    if (m.pin) {
      setPinFor(m);
      setPin('');
      return;
    }
    if (confirm(`¿Entrar como ${m.name} en este teléfono?`)) onPick(m);
  };

  const handlePinSubmit = () => {
    if (pin.trim() === String(pinFor.pin)) {
      onPick(pinFor);
    } else {
      alert('PIN incorrecto');
      setPin('');
    }
  };

  return (
    <div style={{ ...screenStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <SharedStyles />
      <div className="vj-card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52 }}>{trip.config.emoji || '✈️'}</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 700, margin: '8px 0 4px' }}>{trip.config.name}</h1>
          <p style={{ color: INK_SOFT, margin: 0, fontSize: 15 }}>
            {mode === 'pick' ? '¿Quién sos? Tocá tu nombre.' : 'Contanos quién sos, así todos saben quién agrega cada plan.'}
          </p>
        </div>

        {mode === 'pick' && !pinFor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <button
                key={m.id}
                className="vj-press"
                onClick={() => handlePickExisting(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  background: '#fff', border: '1.5px solid #E8DEC9', borderRadius: 14, padding: '11px 14px',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17 }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: 16, flex: 1 }}>{m.name}</span>
                {m.pin && <span style={{ fontSize: 13, color: INK_SOFT }}>🔒</span>}
              </button>
            ))}
            <button onClick={() => setMode('new')} style={{ background: 'transparent', color: INK_SOFT, fontSize: 14.5, padding: 10, textDecoration: 'underline' }}>
              No estoy en la lista — soy nuevo/a
            </button>
            <GhostButton onClick={onLeave} style={{ border: 'none', color: INK_SOFT, background: 'transparent' }}>Salir</GhostButton>
          </div>
        )}

        {mode === 'pick' && pinFor && (
          <div className="vj-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>PIN de {pinFor.name}</p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
              style={{ textAlign: 'center', fontSize: 22, letterSpacing: 6, maxWidth: 180 }}
            />
            <PrimaryButton onClick={handlePinSubmit}>Entrar como {pinFor.name}</PrimaryButton>
            <button onClick={() => setPinFor(null)} style={{ background: 'transparent', color: INK_SOFT, fontSize: 14, textDecoration: 'underline' }}>Volver</button>
          </div>
        )}

        {mode === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input autoFocus placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} style={{ textAlign: 'center', fontSize: 17 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {MEMBER_COLORS.map(c => (
                <button
                  key={c}
                  className="vj-press"
                  onClick={() => setColor(c)}
                  title={usedColors.includes(c) ? 'Color ya usado por otro viajero' : ''}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', background: c,
                    border: color === c ? `3px solid ${INK}` : '3px solid transparent',
                    opacity: usedColors.includes(c) && color !== c ? 0.35 : 1,
                  }}
                />
              ))}
            </div>
            <PrimaryButton onClick={() => name.trim() ? onSubmit(name, color) : alert('Poné tu nombre')}>Entrar al viaje</PrimaryButton>
            {members.length > 0 && (
              <button onClick={() => setMode('pick')} style={{ background: 'transparent', color: INK_SOFT, fontSize: 14.5, padding: 4, textDecoration: 'underline' }}>
                Ya estoy en la lista de viajeros
              </button>
            )}
            <GhostButton onClick={onLeave} style={{ border: 'none', color: INK_SOFT, background: 'transparent' }}>Salir</GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// APP PRINCIPAL
// ============================================================================

function MainApp({ tripCode, trip, member, syncStatus, onMemberChange, onLeave }) {
  const [tab, setTab] = useState('plan');
  const [eventModal, setEventModal] = useState(null); // null | {mode:'new', date} | {mode:'edit', event}
  const [detailEvent, setDetailEvent] = useState(null);
  const [fullPhoto, setFullPhoto] = useState(null);

  const config = trip.config;
  const events = useMemo(() => Object.values(trip.events || {}), [trip.events]);
  const members = useMemo(() => Object.values(trip.members || {}).sort((a, b) => a.joinedAt - b.joinedAt), [trip.members]);
  const docs = useMemo(() => Object.values(trip.docs || {}).sort((a, b) => b.createdAt - a.createdAt), [trip.docs]);

  useNotificationEngine(tripCode, trip, member);

  // El detalle abierto se refresca si otro viajero edita el evento
  const liveDetailEvent = detailEvent ? (trip.events?.[detailEvent.id] || null) : null;

  const handleSaveEvent = async (event) => {
    await saveTripNode(tripCode, `events/${event.id}`, event);
    setEventModal(null);
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm(`¿Borrar "${event.title}"? Se borra para todos.`)) return;
    setDetailEvent(null);
    await removeTripNode(tripCode, `events/${event.id}`);
  };

  return (
    <div style={{ ...screenStyle, paddingBottom: 90 }}>
      <SharedStyles />
      <Header config={config} syncStatus={syncStatus} />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 14px' }}>
        {tab === 'plan' && (
          <ItineraryView
            config={config}
            events={events}
            members={members}
            onAdd={(date) => setEventModal({ mode: 'new', date })}
            onOpen={(ev) => setDetailEvent(ev)}
          />
        )}
        {tab === 'docs' && (
          <DocsView tripCode={tripCode} docs={docs} member={member} members={members} onFullPhoto={setFullPhoto} />
        )}
        {tab === 'people' && (
          <PeopleView tripCode={tripCode} config={config} members={members} member={member} onMemberChange={onMemberChange} onLeave={onLeave} />
        )}
      </div>

      {tab === 'plan' && (
        <button
          className="vj-press"
          onClick={() => setEventModal({ mode: 'new', date: null })}
          style={{
            position: 'fixed', right: 18, bottom: 86, width: 58, height: 58, borderRadius: '50%',
            background: `linear-gradient(135deg, ${ACCENT}, #D96B38)`, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(232, 128, 79, 0.45)', zIndex: 40,
          }}
          aria-label="Agregar actividad"
        >
          <Plus size={30} />
        </button>
      )}

      <TabBar tab={tab} setTab={setTab} />

      {eventModal && (
        <EventModal
          config={config}
          member={member}
          initial={eventModal.mode === 'edit' ? eventModal.event : null}
          defaultDate={eventModal.date}
          onSave={handleSaveEvent}
          onClose={() => setEventModal(null)}
        />
      )}

      {liveDetailEvent && (
        <EventDetail
          event={liveDetailEvent}
          members={members}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEventModal({ mode: 'edit', event: liveDetailEvent }); setDetailEvent(null); }}
          onDelete={() => handleDeleteEvent(liveDetailEvent)}
          onFullPhoto={setFullPhoto}
        />
      )}

      {fullPhoto && (
        <div
          className="vj-overlay"
          onClick={() => setFullPhoto(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(30, 22, 12, 0.95)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
          }}
        >
          <img src={fullPhoto} alt="Foto" style={{ maxWidth: '100%', maxHeight: '92vh', borderRadius: 10 }} />
          <button onClick={() => setFullPhoto(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

function Header({ config, syncStatus }) {
  const today = todayKey();
  let chip;
  if (today < config.startDate) {
    const n = daysBetween(today, config.startDate);
    chip = n === 1 ? '¡Mañana salimos! 🎉' : `Faltan ${n} días 🔥`;
  } else if (today <= config.endDate) {
    const dayN = daysBetween(config.startDate, today) + 1;
    const total = daysBetween(config.startDate, config.endDate) + 1;
    chip = `Día ${dayN} de ${total} ✨`;
  } else {
    chip = 'Viaje terminado 🧡';
  }

  return (
    <div style={{
      background: `linear-gradient(150deg, #4A3826 0%, ${INK} 80%)`, color: '#fff',
      padding: 'calc(env(safe-area-inset-top, 0px) + 18px) 18px 18px', marginBottom: 16,
      borderRadius: '0 0 24px 24px', boxShadow: '0 4px 16px rgba(61, 46, 31, 0.25)',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 34 }}>{config.emoji || '✈️'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config.name}</div>
          <div style={{ fontSize: 13, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
            {config.destination && <><MapPin size={12} /> {config.destination} · </>}
            {formatDayShort(config.startDate)} → {formatDayShort(config.endDate)}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{chip}</span>
          <span style={{ opacity: 0.75 }} title={syncStatus === 'connected' ? 'Sincronizado' : 'Conectando…'}>
            {syncStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
          </span>
        </div>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'plan', label: 'Itinerario', icon: Calendar },
    { id: 'docs', label: 'Pasajes y fotos', icon: ImageIcon },
    { id: 'people', label: 'Viaje', icon: Users },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff', borderTop: '1px solid #EEE4D2',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      boxShadow: '0 -4px 16px rgba(61, 46, 31, 0.06)',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 4px 8px', background: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: active ? ACCENT : INK_SOFT, fontWeight: active ? 700 : 500, fontSize: 11.5,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ITINERARIO
// ============================================================================

function ItineraryView({ config, events, members, onAdd, onOpen }) {
  const today = todayKey();
  const todayRef = useRef(null);
  const scrolledOnce = useRef(false);

  const byDate = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.date) return;
      (map[ev.date] = map[ev.date] || []).push(ev);
    });
    Object.values(map).forEach(list => list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')));
    return map;
  }, [events]);

  const days = useMemo(() => {
    const base = dateRange(config.startDate, config.endDate);
    const extra = Object.keys(byDate).filter(d => !base.includes(d));
    return [...base, ...extra].sort();
  }, [config.startDate, config.endDate, byDate]);

  const nextEvent = useMemo(() => {
    const now = new Date();
    return events
      .filter(ev => ev.date)
      .map(ev => ({ ev, dt: eventDateTime(ev) }))
      .filter(({ dt }) => dt && dt >= now)
      .sort((a, b) => a.dt - b.dt)[0]?.ev || null;
  }, [events]);

  useEffect(() => {
    if (scrolledOnce.current || !todayRef.current) return;
    scrolledOnce.current = true;
    setTimeout(() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
  }, []);

  const memberById = (id) => members.find(m => m.id === id);

  return (
    <div>
      {nextEvent && (
        <button
          className="vj-card vj-press"
          onClick={() => onOpen(nextEvent)}
          style={{
            width: '100%', textAlign: 'left', background: '#FDEEDC', border: `2px solid ${ACCENT}55`,
            borderRadius: 16, padding: '12px 14px', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <Sparkles size={20} color={ACCENT} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B25A28', textTransform: 'uppercase', letterSpacing: 0.5 }}>Próximo plan</div>
            <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getCategory(nextEvent.category).emoji} {nextEvent.title}
            </div>
            <div style={{ fontSize: 13, color: '#8A6A50' }}>
              {formatDayShort(nextEvent.date)}{nextEvent.time ? ` · ${nextEvent.time} hs` : ''}
            </div>
          </div>
        </button>
      )}

      {days.map(day => {
        const isToday = day === today;
        const list = byDate[day] || [];
        const dayNum = daysBetween(config.startDate, day) + 1;
        const inTrip = day >= config.startDate && day <= config.endDate;
        return (
          <div key={day} ref={isToday ? todayRef : null} style={{ marginBottom: 18, scrollMarginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, padding: '0 2px' }}>
              <span style={{
                fontFamily: SERIF, fontWeight: 700, fontSize: 16,
                color: isToday ? ACCENT : INK,
              }}>
                {isToday ? '📍 HOY — ' : ''}{formatDayLabel(day)}
              </span>
              {inTrip && <span style={{ fontSize: 12, color: INK_SOFT }}>Día {dayNum}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.length === 0 && (
                <button
                  className="vj-press"
                  onClick={() => onAdd(day)}
                  style={{
                    background: '#fff', border: '2px dashed #DFD3BC', borderRadius: 14,
                    padding: '12px', color: INK_SOFT, fontSize: 14, textAlign: 'center',
                  }}
                >
                  Sin planes todavía — tocá para agregar
                </button>
              )}
              {list.map(ev => {
                const cat = getCategory(ev.category);
                const creator = memberById(ev.createdBy);
                const past = eventDateTime(ev) < new Date() && day <= today;
                return (
                  <button
                    key={ev.id}
                    className="vj-card vj-press"
                    onClick={() => onOpen(ev)}
                    style={{
                      textAlign: 'left', background: '#fff', borderRadius: 14, padding: '12px 14px',
                      border: 'none', borderLeft: `5px solid ${cat.color}`, boxShadow: CARD_SHADOW,
                      display: 'flex', alignItems: 'center', gap: 12, opacity: past ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{cat.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                      <div style={{ fontSize: 13, color: INK_SOFT, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {ev.time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {ev.time} hs</span>}
                        {ev.place && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}><MapPin size={12} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{ev.place}</span></span>}
                        {(ev.photos?.length > 0) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Camera size={12} /> {ev.photos.length}</span>}
                        {ev.alertMin > 0 && <Bell size={12} />}
                      </div>
                    </div>
                    {creator && (
                      <div title={`Agregó ${creator.name}`} style={{ width: 10, height: 10, borderRadius: '50%', background: creator.color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MODAL: AGREGAR / EDITAR EVENTO
// ============================================================================

function EventModal({ config, member, initial, defaultDate, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || 'actividad');
  const [date, setDate] = useState(initial?.date || defaultDate || (todayKey() >= config.startDate && todayKey() <= config.endDate ? todayKey() : config.startDate));
  const [time, setTime] = useState(initial?.time || '');
  const [place, setPlace] = useState(initial?.place || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [alertMin, setAlertMin] = useState(initial?.alertMin ?? 60);
  const [photos, setPhotos] = useState(initial?.photos || []);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handlePhotos = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, 4 - photos.length);
    for (const file of files) {
      try {
        const dataUrl = await compressImage(file);
        setPhotos(prev => prev.length < 4 ? [...prev, dataUrl] : prev);
      } catch {
        alert('No se pudo procesar una de las fotos');
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('Poné un título (ej: "Vuelo a Madrid")'); return; }
    if (!date) { alert('Elegí el día'); return; }
    setSaving(true);
    await onSave({
      id: initial?.id || generateId(),
      title: title.trim(),
      category,
      date,
      time: time || null,
      place: place.trim() || null,
      notes: notes.trim() || null,
      alertMin: time ? Number(alertMin) : 0,
      photos,
      createdBy: initial?.createdBy || member.id,
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <Sheet onClose={onClose} title={initial ? 'Editar plan' : 'Nuevo plan'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input autoFocus={!initial} placeholder="¿Qué plan es? ej: Vuelo a Madrid" value={title} onChange={e => setTitle(e.target.value)} style={{ fontSize: 16, fontWeight: 600 }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className="vj-press"
              onClick={() => setCategory(c.id)}
              style={{
                padding: '7px 12px', borderRadius: 20, fontSize: 13.5, fontWeight: 600,
                background: category === c.id ? `${c.color}22` : '#F7F0E3',
                border: category === c.id ? `2px solid ${c.color}` : '2px solid transparent',
                color: INK,
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1.3 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Día</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Hora</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        {time && (
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>🔔 Avisar a todos</label>
            <select value={alertMin} onChange={e => setAlertMin(e.target.value)}>
              {ALERT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        <input placeholder="📍 Lugar (opcional)" value={place} onChange={e => setPlace(e.target.value)} />
        <textarea placeholder="Notas: reserva, asientos, qué llevar… (opcional)" rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />

        <div>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Fotos (pasaje, entrada, reserva…)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={p} alt={`Foto ${i + 1}`} style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 10 }} />
                <button
                  onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#C0392B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                className="vj-press"
                onClick={() => fileRef.current?.click()}
                style={{ width: 68, height: 68, borderRadius: 10, border: '2px dashed #DFD3BC', background: '#FBF5E9', color: INK_SOFT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 11 }}
              >
                <Camera size={20} />
                Foto
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => handlePhotos(e.target.files)} style={{ display: 'none' }} />
        </div>

        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando…' : (initial ? 'Guardar cambios' : 'Agregar al viaje')}
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

// ============================================================================
// DETALLE DE EVENTO
// ============================================================================

function EventDetail({ event, members, onClose, onEdit, onDelete, onFullPhoto }) {
  const cat = getCategory(event.category);
  const creator = members.find(m => m.id === event.createdBy);
  return (
    <Sheet onClose={onClose} title={`${cat.emoji} ${cat.label}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontFamily: SERIF, margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>{event.title}</h2>
          <div style={{ color: INK_SOFT, fontSize: 14.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} /> {formatDayLabel(event.date)}{event.time ? ` · ${event.time} hs` : ''}
            </span>
            {event.place && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={15} /> {event.place}</span>}
            {event.alertMin > 0 && event.time && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Bell size={15} /> Alerta {ALERT_OPTIONS.find(o => o.value === Number(event.alertMin))?.label.toLowerCase() || `${event.alertMin} min antes`}
              </span>
            )}
            {creator && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: creator.color, display: 'inline-block' }} /> Agregado por {creator.name}
              </span>
            )}
          </div>
        </div>

        {event.notes && (
          <div style={{ background: '#FBF5E9', borderRadius: 12, padding: '10px 12px', fontSize: 14.5, display: 'flex', gap: 8 }}>
            <StickyNote size={16} style={{ flexShrink: 0, marginTop: 2 }} color={INK_SOFT} />
            <span style={{ whiteSpace: 'pre-wrap' }}>{event.notes}</span>
          </div>
        )}

        {event.photos?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {event.photos.map((p, i) => (
              <img
                key={i}
                src={p}
                alt={`Foto ${i + 1}`}
                onClick={() => onFullPhoto(p)}
                style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 12, cursor: 'pointer' }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <GhostButton onClick={onEdit} style={{ flex: 1 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Edit2 size={16} /> Editar</span>
          </GhostButton>
          <GhostButton onClick={onDelete} style={{ flex: 1, color: '#C0392B', borderColor: '#F0C6C0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={16} /> Borrar</span>
          </GhostButton>
        </div>
      </div>
    </Sheet>
  );
}

// ============================================================================
// PASAJES Y FOTOS (DOCUMENTOS SUELTOS)
// ============================================================================

function DocsView({ tripCode, docs, member, members, onFullPhoto }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch {
      alert('No se pudo procesar la foto');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!photo) { alert('Sacá o elegí una foto'); return; }
    setSaving(true);
    const doc = {
      id: generateId(),
      title: title.trim() || 'Documento',
      photo,
      addedBy: member.id,
      createdAt: Date.now(),
    };
    await saveTripNode(tripCode, `docs/${doc.id}`, doc);
    setAdding(false); setTitle(''); setPhoto(null); setSaving(false);
  };

  const handleDelete = async (doc) => {
    if (!confirm(`¿Borrar "${doc.title}"? Se borra para todos.`)) return;
    await removeTripNode(tripCode, `docs/${doc.id}`);
  };

  return (
    <div>
      <p style={{ color: INK_SOFT, fontSize: 14, margin: '0 0 14px' }}>
        Pasajes, reservas, entradas, seguros: sacales foto y quedan acá a mano para todos.
      </p>

      <button
        className="vj-press"
        onClick={() => setAdding(true)}
        style={{
          width: '100%', padding: '13px', borderRadius: 14, fontWeight: 700, fontSize: 15,
          background: '#fff', color: ACCENT, border: `2px dashed ${ACCENT}88`, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Camera size={19} /> Agregar foto de documento
      </button>

      {docs.length === 0 && !adding && (
        <div style={{ textAlign: 'center', color: INK_SOFT, padding: '30px 0', fontSize: 14.5 }}>
          Todavía no hay documentos.<br />Empezá con la foto de tus pasajes ✈️
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {docs.map(doc => {
          const owner = members.find(m => m.id === doc.addedBy);
          return (
            <div key={doc.id} className="vj-card" style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
              <img
                src={doc.photo}
                alt={doc.title}
                onClick={() => onFullPhoto(doc.photo)}
                style={{ width: '100%', height: 120, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
              />
              <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                  {owner && <div style={{ fontSize: 11.5, color: INK_SOFT }}>de {owner.name}</div>}
                </div>
                <button onClick={() => handleDelete(doc)} style={{ background: 'none', color: '#C77', padding: 4 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {adding && (
        <Sheet onClose={() => { setAdding(false); setPhoto(null); setTitle(''); }} title="Nuevo documento">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input autoFocus placeholder="¿Qué es? ej: Pasajes ida" value={title} onChange={e => setTitle(e.target.value)} />
            {photo ? (
              <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
                <img src={photo} alt="Documento" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 12 }} />
                <button
                  onClick={() => setPhoto(null)}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(20,30,45,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                className="vj-press"
                onClick={() => fileRef.current?.click()}
                style={{ padding: '26px', borderRadius: 14, border: '2px dashed #DFD3BC', background: '#FBF5E9', color: INK_SOFT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <Camera size={26} />
                Sacar foto o elegir de la galería
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files)} style={{ display: 'none' }} />
            <PrimaryButton onClick={handleSave} disabled={saving || !photo}>{saving ? 'Guardando…' : 'Guardar'}</PrimaryButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ============================================================================
// VIAJE: CÓDIGO, GENTE, NOTIFICACIONES, AJUSTES
// ============================================================================

function PeopleView({ tripCode, config, members, member, onMemberChange, onLeave }) {
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRemoveMember = async (m) => {
    if (!confirm(`¿Sacar a ${m.name} de la lista de viajeros? Los planes que agregó se conservan. Útil para borrar duplicados.`)) return;
    await removeTripNode(tripCode, `members/${m.id}`);
  };

  const shareText = `¡Sumate a "${config.name}" en TizTrip! 🌎\n\n1. Entrá a ${window.location.origin}/tiztrip.html\n2. Tocá "Tengo un código de viaje"\n3. Ingresá el código: ${tripCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tripCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      prompt('Copiá el código:', tripCode);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: config.name, text: shareText }); } catch { /* canceló */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Invitación copiada. Pegala en WhatsApp 📲');
      } catch {
        prompt('Copiá la invitación:', shareText);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="vj-card" style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: CARD_SHADOW }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Invitar al viaje</div>
        <p style={{ color: INK_SOFT, fontSize: 13.5, margin: '0 0 10px' }}>
          Compartí este código. Cada persona entra desde su teléfono, pone su nombre y ve (y recibe) todo.
        </p>
        <div style={{ fontFamily: SERIF, background: '#FBF5E9', border: '1.5px solid #E8DEC9', borderRadius: 12, padding: '12px 14px', textAlign: 'center', fontWeight: 700, fontSize: 20, letterSpacing: 0.5, marginBottom: 10 }}>
          {tripCode}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <GhostButton onClick={handleCopy} style={{ flex: 1 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{copied ? <Check size={16} color="#52A88A" /> : <Copy size={16} />} {copied ? 'Copiado' : 'Copiar'}</span>
          </GhostButton>
          <PrimaryButton onClick={handleShare} style={{ flex: 1, width: 'auto', padding: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Share2 size={16} /> Compartir</span>
          </PrimaryButton>
        </div>
      </div>

      <NotificationsCard />

      <div className="vj-card" style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: CARD_SHADOW }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Viajeros ({members.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, flex: 1 }}>
                {m.name}
                {m.pin && <span style={{ fontSize: 12, marginLeft: 6 }}>🔒</span>}
                {m.id === member.id && <span style={{ fontSize: 12, background: '#F5EDDE', color: INK_SOFT, borderRadius: 10, padding: '2px 8px', marginLeft: 8 }}>vos</span>}
              </span>
              {m.id !== member.id && (
                <button onClick={() => handleRemoveMember(m)} title="Sacar de la lista" style={{ background: 'none', color: '#C77', padding: 4 }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="vj-card" style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <GhostButton onClick={() => setEditingProfile(true)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={16} /> Mi perfil (nombre, color y PIN)</span>
        </GhostButton>
        <GhostButton onClick={() => setEditingTrip(true)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Edit2 size={16} /> Editar datos del viaje</span>
        </GhostButton>
        <GhostButton onClick={onLeave} style={{ color: '#C0392B', borderColor: '#F0C6C0' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LogOut size={16} /> Salir del viaje en este teléfono</span>
        </GhostButton>
      </div>

      {editingTrip && (
        <EditTripSheet tripCode={tripCode} config={config} onClose={() => setEditingTrip(false)} />
      )}

      {editingProfile && (
        <ProfileSheet
          tripCode={tripCode}
          member={member}
          members={members}
          onSaved={onMemberChange}
          onClose={() => setEditingProfile(false)}
        />
      )}
    </div>
  );
}

function ProfileSheet({ tripCode, member, members, onSaved, onClose }) {
  const [name, setName] = useState(member.name);
  const [color, setColor] = useState(member.color);
  const [pin, setPin] = useState(member.pin ? String(member.pin) : '');
  const [saving, setSaving] = useState(false);
  const usedColors = members.filter(m => m.id !== member.id).map(m => m.color);

  const handleSave = async () => {
    if (!name.trim()) { alert('Poné tu nombre'); return; }
    const cleanPin = pin.trim();
    if (cleanPin && cleanPin.length < 4) { alert('El PIN tiene que tener al menos 4 números'); return; }
    setSaving(true);
    const updated = { ...member, name: name.trim(), color, pin: cleanPin || null };
    await saveTripNode(tripCode, `members/${member.id}`, updated);
    onSaved(updated);
    onClose();
  };

  return (
    <Sheet onClose={onClose} title="Mi perfil">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Tu nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Tu color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {MEMBER_COLORS.map(c => (
              <button
                key={c}
                className="vj-press"
                onClick={() => setColor(c)}
                style={{
                  width: 38, height: 38, borderRadius: '50%', background: c,
                  border: color === c ? `3px solid ${INK}` : '3px solid transparent',
                  opacity: usedColors.includes(c) && color !== c ? 0.35 : 1,
                }}
              />
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>🔒 PIN (opcional)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="ej: 1234 — para que nadie entre como vos"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          />
          <p style={{ color: INK_SOFT, fontSize: 12.5, margin: '6px 0 0' }}>
            Si lo ponés, al elegir tu nombre desde otro teléfono van a tener que escribirlo. Dejalo vacío para entrar sin PIN.
          </p>
        </div>
        <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</PrimaryButton>
      </div>
    </Sheet>
  );
}

function EditTripSheet({ tripCode, config, onClose }) {
  const [name, setName] = useState(config.name);
  const [destination, setDestination] = useState(config.destination || '');
  const [emoji, setEmoji] = useState(config.emoji || '✈️');
  const [startDate, setStartDate] = useState(config.startDate);
  const [endDate, setEndDate] = useState(config.endDate);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { alert('El viaje necesita un nombre'); return; }
    setSaving(true);
    await saveTripNode(tripCode, 'config', {
      ...config,
      name: name.trim(),
      destination: destination.trim(),
      emoji,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
    });
    onClose();
  };

  return (
    <Sheet onClose={onClose} title="Editar viaje">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del viaje" />
        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destino" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRIP_EMOJIS.map(e => (
            <button key={e} className="vj-press" onClick={() => setEmoji(e)} style={{ fontSize: 22, width: 42, height: 42, borderRadius: 11, background: emoji === e ? '#FDEEDC' : '#fff', border: emoji === e ? `2px solid ${ACCENT}` : '2px solid #E8DEC9' }}>{e}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Salida</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>Vuelta</label>
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</PrimaryButton>
      </div>
    </Sheet>
  );
}

function NotificationsCard() {
  const [permission, setPermission] = useState(() => notificationsSupported() ? Notification.permission : 'unsupported');

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      showNotification('¡Listo! 🔔', 'Vas a recibir las alertas del viaje en este teléfono.', 'test');
    } else if (result === 'denied') {
      alert('Las notificaciones están bloqueadas para este sitio. Activalas desde la configuración del navegador (Permisos del sitio → Notificaciones).');
    }
  };

  return (
    <div className="vj-card" style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: CARD_SHADOW }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {permission === 'granted' ? <Bell size={17} color="#52A88A" /> : <BellOff size={17} color={INK_SOFT} />} Alertas en este teléfono
      </div>

      {permission === 'unsupported' && (
        <p style={{ color: INK_SOFT, fontSize: 13.5, margin: 0 }}>
          Este navegador no soporta notificaciones. En iPhone: compartí la página y usá <b>"Agregar a inicio"</b>; abriéndola desde ese ícono sí funcionan.
        </p>
      )}

      {permission === 'granted' && (
        <>
          <p style={{ color: INK_SOFT, fontSize: 13.5, margin: '0 0 10px' }}>
            Activadas ✅ — te avisamos antes de cada plan con alerta, con un resumen a la mañana, y cuando alguien agrega una actividad nueva. Cada viajero las activa en su propio teléfono desde esta misma pantalla.
          </p>
          <GhostButton onClick={() => showNotification('Probando 🔔', 'Así se van a ver las alertas del viaje.', 'test')}>
            Probar notificación
          </GhostButton>
        </>
      )}

      {(permission === 'default' || permission === 'denied') && (
        <>
          <p style={{ color: INK_SOFT, fontSize: 13.5, margin: '0 0 10px' }}>
            Activalas para que te avise antes de cada vuelo o actividad, y cuando alguien sume un plan nuevo.
          </p>
          <PrimaryButton onClick={handleEnable}>Activar alertas</PrimaryButton>
          <p style={{ color: INK_SOFT, fontSize: 12, margin: '8px 0 0' }}>
            Consejo: agregá la app a la pantalla de inicio (menú del navegador → "Agregar a inicio") para que las alertas lleguen mejor.
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// SHEET (MODAL DESLIZANTE)
// ============================================================================

function Sheet({ title, children, onClose }) {
  return (
    <div
      className="vj-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(42, 32, 20, 0.55)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        className="vj-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto',
          background: BG, borderRadius: '22px 22px 0 0', padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, flex: 1 }}>{title}</div>
          <button onClick={onClose} style={{ background: '#F0E7D5', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// MOTOR DE NOTIFICACIONES
// Cada dispositivo con permiso otorgado programa localmente las alertas del
// itinerario compartido: aviso previo por evento, resumen matutino y aviso
// cuando otro viajero agrega un plan nuevo.
// ============================================================================

function useNotificationEngine(tripCode, trip, member) {
  const eventsRef = useRef({});
  useEffect(() => {
    eventsRef.current = trip.events || {};
  }, [trip.events]);

  // Aviso de actividades nuevas agregadas por otros
  useEffect(() => {
    const events = trip.events || {};
    const seenKey = `${SEEN_EVENTS_KEY}_${tripCode}`;
    const seen = loadState(seenKey, null);
    const ids = Object.keys(events);

    if (seen !== null) {
      const newOnes = ids.filter(id => !seen.includes(id));
      newOnes.forEach(id => {
        const ev = events[id];
        if (!ev || ev.createdBy === member.id) return;
        if (Date.now() - (ev.createdAt || 0) > 3600000) return;
        const firedKey = `new-${id}`;
        if (getFired()[firedKey]) return;
        markFired(firedKey);
        const cat = getCategory(ev.category);
        showNotification(
          `Plan nuevo en el viaje ${cat.emoji}`,
          `${ev.title} — ${formatDayShort(ev.date)}${ev.time ? ` a las ${ev.time} hs` : ''}`,
          firedKey,
        );
      });
    }
    saveState(seenKey, ids);
  }, [trip.events, tripCode, member.id]);

  // Alertas programadas: chequeo cada 30 segundos
  useEffect(() => {
    const check = () => {
      if (!notificationsSupported() || Notification.permission !== 'granted') return;
      const now = new Date();
      const events = Object.values(eventsRef.current);

      // Aviso previo por evento
      events.forEach(ev => {
        if (!ev.date || !ev.time || !ev.alertMin) return;
        const dt = eventDateTime(ev);
        if (!dt) return;
        const notifyAt = new Date(dt.getTime() - Number(ev.alertMin) * 60000);
        if (now < notifyAt || now > dt) return;
        const firedKey = `evt-${ev.id}-${ev.date}-${ev.time}-${ev.alertMin}`;
        if (getFired()[firedKey]) return;
        markFired(firedKey);
        const cat = getCategory(ev.category);
        const mins = Math.max(1, Math.round((dt - now) / 60000));
        showNotification(
          `${cat.emoji} ${ev.title}`,
          `En ${mins >= 60 ? `${Math.round(mins / 60)} h` : `${mins} min`} · ${ev.time} hs${ev.place ? ` · ${ev.place}` : ''}`,
          firedKey,
        );
      });

      // Resumen matutino de los planes del día
      const today = todayKey();
      if (now.getHours() >= 8) {
        const todayEvents = events
          .filter(ev => ev.date === today)
          .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        if (todayEvents.length > 0) {
          const firedKey = `morning-${today}`;
          if (!getFired()[firedKey]) {
            markFired(firedKey);
            showNotification(
              `Hoy: ${todayEvents.length} ${todayEvents.length === 1 ? 'plan' : 'planes'} 🗓️`,
              todayEvents.slice(0, 3).map(ev => `${getCategory(ev.category).emoji} ${ev.time ? `${ev.time} — ` : ''}${ev.title}`).join('\n') + (todayEvents.length > 3 ? `\n…y ${todayEvents.length - 3} más` : ''),
              firedKey,
            );
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [tripCode]);
}
