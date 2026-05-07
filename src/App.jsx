import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, CheckSquare, ListTodo, Sparkles, Home, Plus, Check, Trophy, Briefcase, Clock, DollarSign, Star, X, Trash2, Edit2, Repeat, History as HistoryIcon, Lock, Eye, RotateCcw, ChevronRight, ChevronLeft, Users, Baby, HeartHandshake, Settings as SettingsIcon, Award, Cloud, CloudOff, Copy, Share2, KeyRound, Wifi, PawPrint, Wand2, UtensilsCrossed, PieChart, Sun, Moon, Sunrise } from 'lucide-react';
import {
  DAYS_ES, DAYS_FULL, MONTHS, MONTHS_SHORT, PALETTE, DEFAULT_BONUS_PCT,
  PET_TYPES, getPetEmoji, getPetTypeLabel, ROUTINE_TEMPLATES,
  TIME_OF_DAY, getTimeOfDayInfo, getCurrentTimeOfDay,
  MEAL_CATALOG, MEAL_BALANCE_CATEGORIES, mealBalanceCategories, getMealById,
  dateKey, parseKey, daysBetween, appliesOn, recurrenceLabel, todayKey,
  loadState, saveState, verifyAdminPin, updateAdminPin, setInitialAdminPin,
  buildFamilyFromOnboarding, generateMemberId, getUsedColors,
  getLocation, fetchWeather, weatherCodeToInfo,
  formatMoney, formatTime, formatDate,
  FAMILY_CODE_KEY, getStoredFamilyPin, setStoredFamilyPin,
  normalizeFamilyData,
} from './lib.js';
import { generateFamilyCode, subscribeFamilyData, saveFamilyData, checkFamilyCodeExists } from './firebase.js';

// ============================================================================
// HELPERS para estructuras compartidas (rutinas y tareas)
// ============================================================================
// Una rutina/tarea puede tener:
//   - who: string  (formato viejo, individual)
//   - whoIds: array (formato nuevo, individual o compartida si len > 1)

const itemAppliesTo = (item, memberId) => {
  if (Array.isArray(item.whoIds)) return item.whoIds.includes(memberId);
  return item.who === memberId;
};

const itemMembers = (item) => {
  if (Array.isArray(item.whoIds)) return item.whoIds;
  if (item.who) return [item.who];
  return [];
};

const isSharedItem = (item) => Array.isArray(item.whoIds) && item.whoIds.length > 1;

// Para rutinas: el timeOfDay default es 'any'
const getRoutineTimeOfDay = (r) => r.timeOfDay || 'any';

export default function App() {
  const [familyCode, setFamilyCode] = useState(() => loadState(FAMILY_CODE_KEY, null));
  const [cloudData, setCloudData] = useState(null);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [showWelcome, setShowWelcome] = useState(() => !loadState(FAMILY_CODE_KEY, null));
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!familyCode) return;
    setSyncStatus('connecting');
    const unsubscribe = subscribeFamilyData(familyCode, (data) => {
      if (data) {
        setCloudData(data);
        setSyncStatus('connected');
        initialLoadDone.current = true;
      } else {
        setCloudData({ config: null, empty: true });
        setSyncStatus('connected');
        initialLoadDone.current = true;
      }
    });
    return () => { try { unsubscribe(); } catch {} };
  }, [familyCode]);

  const handleNewFamily = () => {
    const newCode = generateFamilyCode();
    saveState(FAMILY_CODE_KEY, newCode);
    setFamilyCode(newCode);
    setShowWelcome(false);
  };

  const handleJoinFamily = async (code) => {
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode || cleanCode.length < 4) {
      alert('Ingresá un código válido');
      return false;
    }
    const exists = await checkFamilyCodeExists(cleanCode);
    if (!exists) {
      alert(`No encontramos una familia con el código "${cleanCode}". Verificá que esté bien escrito.`);
      return false;
    }
    saveState(FAMILY_CODE_KEY, cleanCode);
    setFamilyCode(cleanCode);
    setShowWelcome(false);
    return true;
  };

  const handleResetFamily = () => {
    if (!confirm('¿Estás seguro? Esto te desconecta de la familia actual en este dispositivo. Los datos en la nube se conservan.')) return;
    Object.keys(localStorage).filter(k => k.startsWith('benditarutina_')).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  if (showWelcome) {
    return <WelcomeFlow onNew={handleNewFamily} onJoin={handleJoinFamily} />;
  }

  if (!cloudData) {
    return <LoadingScreen status={syncStatus} familyCode={familyCode} />;
  }

  if (cloudData.empty || !cloudData.config) {
    return <OnboardingFlow
      familyCode={familyCode}
      onComplete={async (config) => {
        await saveFamilyData(familyCode, { config, updatedAt: Date.now() });
      }}
      onResetFamily={handleResetFamily}
    />;
  }

  return <MainApp
    familyCode={familyCode}
    cloudData={cloudData}
    syncStatus={syncStatus}
    onResetFamily={handleResetFamily}
  />;
}

// ============================================================================
// WELCOME
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF8EE 0%, #FDFAF3 50%, #FFE8D6 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", -apple-system, sans-serif', color: '#3D2E1F' }}>
      <SharedStyles />
      <div className="ob-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>✦</div>
        <div className="serif" style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Bendita Rutina</div>
        <p style={{ fontSize: '14px', color: '#8A7560', marginBottom: '28px' }}>
          La rutina compartida de tu familia, en todos tus dispositivos.
        </p>

        {mode === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="ob-btn" onClick={onNew} style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
              <Sparkles size={18} /> Soy nueva familia
            </button>
            <button className="ob-btn ob-btn-ghost" onClick={() => setMode('join')} style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
              <KeyRound size={18} /> Tengo un código de familia
            </button>
            <p style={{ fontSize: '12px', color: '#8A7560', marginTop: '14px', lineHeight: 1.5 }}>
              <strong>¿Qué es un código de familia?</strong><br/>
              Es como una "sala compartida" donde todos los dispositivos de tu familia ven los mismos datos. Cada familia tiene su propio código.
            </p>
          </div>
        )}

        {mode === 'join' && (
          <div>
            <p style={{ fontSize: '14px', color: '#5A4F42', marginBottom: '14px' }}>
              Pegá el código de familia que te compartieron:
            </p>
            <input
              className="ob-input"
              placeholder="ej: feliz-luna-3421"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              style={{ textAlign: 'center', fontFamily: 'Fraunces, serif', fontSize: '17px', letterSpacing: '0.02em', marginBottom: '16px' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitJoin()}
              disabled={loading}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="ob-btn ob-btn-ghost" onClick={() => { setMode(null); setCode(''); }} style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>Atrás</button>
              <button className="ob-btn" onClick={handleSubmitJoin} style={{ flex: 1, justifyContent: 'center' }} disabled={!code.trim() || loading}>
                {loading ? 'Conectando...' : 'Conectar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ status, familyCode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px', fontFamily: 'DM Sans, sans-serif', color: '#3D2E1F' }}>
      <div style={{ fontSize: '48px' }}>✦</div>
      <div className="serif" style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 600 }}>Bendita Rutina</div>
      <div style={{ fontSize: '13px', color: '#8A7560' }}>
        {status === 'connecting' ? 'Conectando con la nube...' : 'Cargando...'}
      </div>
      <div style={{ fontSize: '11px', color: '#B8A78C', marginTop: '4px' }}>
        Familia: <strong>{familyCode}</strong>
      </div>
    </div>
  );
}

// ============================================================================
// ONBOARDING
// ============================================================================

function OnboardingFlow({ familyCode, onComplete, onResetFamily }) {
  const [step, setStep] = useState(0);
  const [adults, setAdults] = useState([{ id: 'adult1', name: '', color: '#E8804F' }]);
  const [kids, setKids] = useState([{ id: 'kid1', name: '', color: '#F5B645', young: false }]);
  const [helpers, setHelpers] = useState([]);
  const [pets, setPets] = useState([]);
  const [bonusPct, setBonusPct] = useState(DEFAULT_BONUS_PCT);
  const [pin, setPin] = useState('');

  const usedColors = [...adults, ...kids, ...helpers, ...pets].map(p => p.color);
  const availableColors = (current) => Object.values(PALETTE).filter(p => !usedColors.includes(p.color) || p.color === current);

  const addAdult = () => {
    if (adults.length >= 2) return;
    const colors = availableColors();
    setAdults([...adults, { id: `adult${adults.length + 1}`, name: '', color: colors[0]?.color || '#7BA05B' }]);
  };
  const removeAdult = (i) => { if (adults.length > 1) setAdults(adults.filter((_, idx) => idx !== i)); };
  const updateAdult = (i, field, value) => setAdults(adults.map((a, idx) => idx === i ? { ...a, [field]: value } : a));

  const addKid = () => {
    if (kids.length >= 6) return;
    const colors = availableColors();
    setKids([...kids, { id: `kid${kids.length + 1}`, name: '', color: colors[0]?.color || '#E87A93', young: false }]);
  };
  const removeKid = (i) => { if (kids.length > 1) setKids(kids.filter((_, idx) => idx !== i)); };
  const updateKid = (i, field, value) => setKids(kids.map((k, idx) => idx === i ? { ...k, [field]: value } : k));

  const addHelper = () => {
    if (helpers.length >= 4) return;
    const colors = availableColors();
    setHelpers([...helpers, { id: `helper${helpers.length + 1}`, name: '', color: colors[0]?.color || '#5B96B0' }]);
  };
  const removeHelper = (i) => setHelpers(helpers.filter((_, idx) => idx !== i));
  const updateHelper = (i, field, value) => setHelpers(helpers.map((h, idx) => idx === i ? { ...h, [field]: value } : h));

  const addPet = () => {
    if (pets.length >= 5) return;
    const colors = availableColors();
    setPets([...pets, { id: `pet${pets.length + 1}`, name: '', petType: 'dog', color: colors[0]?.color || '#9B7FB8' }]);
  };
  const removePet = (i) => setPets(pets.filter((_, idx) => idx !== i));
  const updatePet = (i, field, value) => setPets(pets.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const canAdvance = () => {
    if (step === 1) return adults.every(a => a.name.trim().length > 0);
    if (step === 2) return kids.every(k => k.name.trim().length > 0);
    if (step === 3) return helpers.every(h => h.name.trim().length > 0);
    if (step === 4) return pets.every(p => p.name.trim().length > 0);
    if (step === 5) return /^\d{4}$/.test(pin);
    return true;
  };

  const finish = async () => {
    setInitialAdminPin(pin);
    setStoredFamilyPin(familyCode, pin);
    await onComplete({ adults, kids, helpers, pets, bonusPct, pinSet: true });
  };

  return (
    <OnboardingShell familyCode={familyCode} onResetFamily={onResetFamily}>
      <StepIndicator step={step} total={8} />

      {step === 0 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>✦</div>
          <div className="serif" style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Tu nueva familia</div>
          <p style={{ fontSize: '13px', color: '#8A7560', lineHeight: 1.5, marginBottom: '14px' }}>
            Configurá los miembros de tu familia. Después podés compartir el código con los demás dispositivos de tu casa.
          </p>
          <div style={{ background: '#FBF5E9', padding: '12px 14px', borderRadius: '12px', marginBottom: '20px', fontSize: '12px', color: '#5A4F42' }}>
            Tu código de familia: <strong style={{ fontFamily: 'Fraunces, serif', fontSize: '15px' }}>{familyCode}</strong>
          </div>
          <button className="ob-btn" onClick={() => setStep(1)} style={{ fontSize: '15px' }}>
            Empezar <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <ObHeader icon={<Users size={22} />} title="Los adultos" subtitle="1 o 2 adultos. Son quienes tienen acceso de administrador." />
          {adults.map((a, i) => (
            <PersonForm key={a.id} person={a} index={i} canRemove={adults.length > 1} onRemove={() => removeAdult(i)} onUpdate={(field, value) => updateAdult(i, field, value)} usedColors={usedColors} placeholder={`Nombre del adulto ${i + 1}`} />
          ))}
          {adults.length < 2 && <AddBtn onClick={addAdult} label="Agregar segundo adulto" />}
          <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} canNext={canAdvance()} />
        </div>
      )}

      {step === 2 && (
        <div>
          <ObHeader icon={<Baby size={22} />} title="Los hijos" subtitle='De 1 a 6 hijos. Marcá "Vista simple" si tiene 5 años o menos.' />
          {kids.map((k, i) => (
            <PersonForm key={k.id} person={k} index={i} canRemove={kids.length > 1} onRemove={() => removeKid(i)} onUpdate={(field, value) => updateKid(i, field, value)} usedColors={usedColors} placeholder={`Nombre del hijo ${i + 1}`} showYoung={true} />
          ))}
          {kids.length < 6 && <AddBtn onClick={addKid} label="Agregar otro hijo" />}
          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} canNext={canAdvance()} />
        </div>
      )}

      {step === 3 && (
        <div>
          <ObHeader icon={<HeartHandshake size={22} />} title="Ayuda en casa" subtitle="Personas que ayudan en la casa. Es opcional." />
          {helpers.map((h, i) => (
            <PersonForm key={h.id} person={h} index={i} canRemove={true} onRemove={() => removeHelper(i)} onUpdate={(field, value) => updateHelper(i, field, value)} usedColors={usedColors} placeholder="Nombre" />
          ))}
          {helpers.length < 4 && <AddBtn onClick={addHelper} label="Agregar persona de ayuda" />}
          <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} canNext={canAdvance()} />
        </div>
      )}

      {step === 4 && (
        <div>
          <ObHeader icon={<PawPrint size={22} />} title="Mascotas" subtitle="Hasta 5 mascotas. Después podés asignarles tareas como pasearlas o darles de comer. Es opcional." />
          {pets.map((p, i) => (
            <PetForm key={p.id} pet={p} index={i} onRemove={() => removePet(i)} onUpdate={(field, value) => updatePet(i, field, value)} usedColors={usedColors} />
          ))}
          {pets.length < 5 && <AddBtn onClick={addPet} label="Agregar mascota" />}
          <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} canNext={canAdvance()} />
        </div>
      )}

      {step === 5 && (
        <div>
          <ObHeader icon={<Lock size={22} />} title="PIN de admin" subtitle="4 dígitos. Anotálo en algún lugar seguro." />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <input type="password" inputMode="numeric" maxLength={4} autoFocus className="ob-pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="• • • •" />
            <div style={{ fontSize: '12px', color: '#8A7560', marginTop: '12px' }}>{pin.length}/4 dígitos</div>
          </div>
          <NavButtons onBack={() => setStep(4)} onNext={() => setStep(6)} canNext={canAdvance()} />
        </div>
      )}

      {step === 6 && (
        <div>
          <ObHeader icon={<Award size={22} />} title="Bonus por completar el día" subtitle="Cuando un hijo completa todas sus rutinas del día, suma puntos extra." />
          <BonusPicker value={bonusPct} onChange={setBonusPct} />
          <NavButtons onBack={() => setStep(5)} onNext={() => setStep(7)} canNext={true} nextLabel="Revisar" />
        </div>
      )}

      {step === 7 && (
        <FamilySummary adults={adults} kids={kids} helpers={helpers} pets={pets} bonusPct={bonusPct} pin={pin} onBack={() => setStep(6)} onFinish={finish} />
      )}
    </OnboardingShell>
  );
}

// ============================================================================
// COMPONENTES SHARED (onboarding)
// ============================================================================

function OnboardingShell({ children, familyCode, onResetFamily }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF8EE 0%, #FDFAF3 50%, #FFE8D6 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", -apple-system, sans-serif', color: '#3D2E1F', position: 'relative' }}>
      <SharedStyles />
      <div className="ob-card">{children}</div>
      {familyCode && onResetFamily && (
        <button onClick={onResetFamily} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #E8DEC9', borderRadius: '999px', padding: '6px 12px', fontSize: '11px', color: '#8A7560', cursor: 'pointer' }}>Salir</button>
      )}
    </div>
  );
}

function SharedStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .ob-card { background: white; border-radius: 28px; padding: 40px 36px; max-width: 580px; width: 100%; box-shadow: 0 20px 60px rgba(61,46,31,0.12); }
      .ob-input { width: 100%; padding: 14px 16px; border: 1.5px solid #E8DEC9; border-radius: 12px; font-family: inherit; font-size: 15px; background: #FBF5E9; color: #3D2E1F; outline: none; }
      .ob-input:focus { border-color: #3D2E1F; background: white; }
      .ob-btn { background: #3D2E1F; color: #FDFAF3; border: none; border-radius: 14px; padding: 14px 28px; font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s; }
      .ob-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(61,46,31,0.2); }
      .ob-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
      .ob-btn-ghost { background: transparent; color: #8A7560; border: 1px solid #D4C5B0; }
      .ob-color-btn { width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 1.5px #E8DEC9; cursor: pointer; transition: all 0.15s; padding: 0; }
      .ob-color-btn.selected { box-shadow: 0 0 0 2.5px #3D2E1F; transform: scale(1.15); }
      .ob-color-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .ob-pin { width: 220px; height: 80px; border: 2px solid #E8DEC9; border-radius: 16px; text-align: center; font-size: 36px; font-weight: 700; font-family: 'Fraunces', serif; background: #FBF5E9; color: #3D2E1F; outline: none; }
      .ob-pin:focus { border-color: #3D2E1F; background: white; }
      .ob-toggle { padding: 8px 14px; border-radius: 999px; cursor: pointer; font-size: 12px; font-weight: 600; border: 2px solid #E8DEC9; background: white; color: #3D2E1F; }
      .ob-toggle.selected { background: #3D2E1F; color: white; border-color: #3D2E1F; }
      .person-row { background: #FBF5E9; padding: 14px; border-radius: 14px; margin-bottom: 10px; }
      .step-indicator { display: flex; gap: 6px; justify-content: center; margin-bottom: 28px; }
      .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #E8DEC9; transition: all 0.2s; }
      .step-dot.active { background: #3D2E1F; transform: scale(1.4); }
      .step-dot.done { background: #7BA05B; }
      .pet-type-btn { padding: 8px 12px; border-radius: 10px; border: 2px solid #E8DEC9; background: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; font-family: inherit; color: #3D2E1F; }
      .pet-type-btn.selected { border-color: #3D2E1F; background: #3D2E1F; color: white; }
      @media (max-width: 600px) { .ob-card { padding: 28px 22px; border-radius: 22px; } }
    `}</style>
  );
}

function StepIndicator({ step, total }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, s) => (
        <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`} />
      ))}
    </div>
  );
}

function ObHeader({ icon, title, subtitle }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        {icon && React.cloneElement(icon, { color: '#3D2E1F' })}
        <div className="serif" style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700 }}>{title}</div>
      </div>
      {subtitle && <p style={{ fontSize: '13px', color: '#8A7560', marginBottom: '20px', lineHeight: 1.5 }}>{subtitle}</p>}
    </>
  );
}

function NavButtons({ onBack, onNext, canNext, nextLabel = 'Siguiente' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
      <button className="ob-btn ob-btn-ghost" onClick={onBack}>Atrás</button>
      <button className="ob-btn" onClick={onNext} disabled={!canNext}>{nextLabel} <ChevronRight size={18} /></button>
    </div>
  );
}

function PersonForm({ person, index, canRemove, onRemove, onUpdate, usedColors, placeholder, showYoung = false }) {
  return (
    <div className="person-row">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <input className="ob-input" placeholder={placeholder} value={person.name} onChange={(e) => onUpdate('name', e.target.value)} maxLength={20} />
        {canRemove && <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#C0392B', padding: '8px' }}><Trash2 size={18} /></button>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: showYoung ? '10px' : 0 }}>
        {Object.values(PALETTE).map(p => {
          const isUsed = usedColors.includes(p.color) && person.color !== p.color;
          return (
            <button key={p.color} type="button" disabled={isUsed} onClick={() => onUpdate('color', p.color)} className={`ob-color-btn ${person.color === p.color ? 'selected' : ''}`} style={{ background: p.color }} title={p.name} />
          );
        })}
      </div>
      {showYoung && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" className={`ob-toggle ${!person.young ? 'selected' : ''}`} onClick={() => onUpdate('young', false)}>Vista normal</button>
          <button type="button" className={`ob-toggle ${person.young ? 'selected' : ''}`} onClick={() => onUpdate('young', true)}>Vista simple (≤5 años)</button>
        </div>
      )}
    </div>
  );
}

function PetForm({ pet, index, onRemove, onUpdate, usedColors }) {
  return (
    <div className="person-row">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '28px' }}>{getPetEmoji(pet.petType)}</span>
        <input className="ob-input" placeholder="Nombre de la mascota" value={pet.name} onChange={(e) => onUpdate('name', e.target.value)} maxLength={20} />
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#C0392B', padding: '8px' }}><Trash2 size={18} /></button>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: '#8A7560', marginBottom: '6px', fontWeight: 600 }}>TIPO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {PET_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => onUpdate('petType', t.id)} className={`pet-type-btn ${pet.petType === t.id ? 'selected' : ''}`}>
              <span style={{ fontSize: '15px' }}>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#8A7560', marginBottom: '6px', fontWeight: 600 }}>COLOR</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Object.values(PALETTE).map(p => {
            const isUsed = usedColors.includes(p.color) && pet.color !== p.color;
            return (
              <button key={p.color} type="button" disabled={isUsed} onClick={() => onUpdate('color', p.color)} className={`ob-color-btn ${pet.color === p.color ? 'selected' : ''}`} style={{ background: p.color }} title={p.name} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1.5px dashed #D4C5B0', borderRadius: '12px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
      <Plus size={16} /> {label}
    </button>
  );
}

function BonusPicker({ value, onChange }) {
  const options = [0, 10, 20, 30, 40, 50, 75, 100];
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{ padding: '10px 14px', borderRadius: '10px', border: value === opt ? '2px solid #3D2E1F' : '2px solid #E8DEC9', background: value === opt ? '#3D2E1F' : 'white', color: value === opt ? '#FDFAF3' : '#3D2E1F', cursor: 'pointer', fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, transform: value === opt ? 'scale(1.05)' : 'none', transition: 'all 0.15s', minWidth: '52px' }}>
            {opt === 0 ? 'Sin bonus' : `+${opt}%`}
          </button>
        ))}
      </div>
      <div style={{ background: '#FBF5E9', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#5A4F42', lineHeight: 1.6 }}>
        <strong>Ejemplo:</strong> Si tu hijo tiene 6 rutinas que suman 10 puntos en total, con un bonus de <strong>{value}%</strong> recibe <strong>{Math.round(10 * value / 100)} puntos extra</strong> al completar todas.
      </div>
    </div>
  );
}

function FamilySummary({ adults, kids, helpers, pets, bonusPct, pin, onBack, onFinish }) {
  const [saving, setSaving] = useState(false);
  const handleFinish = async () => { setSaving(true); await onFinish(); };
  return (
    <div>
      <div className="serif" style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Tu familia</div>
      <p style={{ fontSize: '13px', color: '#8A7560', marginBottom: '20px' }}>Revisá que esté todo bien. Después podés editar desde Ajustes.</p>
      <div style={{ background: '#FBF5E9', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
        <SummarySection title={`Adultos (${adults.length})`} people={adults} showLock />
        <SummarySection title={`Hijos (${kids.length})`} people={kids} showYoung style={{ marginTop: '14px' }} />
        {helpers.length > 0 && <SummarySection title={`Ayuda (${helpers.length})`} people={helpers} style={{ marginTop: '14px' }} />}
        {pets.length > 0 && <SummarySection title={`Mascotas (${pets.length})`} people={pets} isPet style={{ marginTop: '14px' }} />}
      </div>
      <div style={{ background: '#FFF4E0', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Award size={16} color="#A67C12" />
        <span style={{ fontSize: '13px', color: '#6B4F18' }}>Bonus: <strong>+{bonusPct}%</strong></span>
      </div>
      <div style={{ background: '#3D2E1F', color: '#FDFAF3', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Lock size={16} />
        <span style={{ fontSize: '13px' }}>PIN admin: <strong style={{ fontFamily: 'Fraunces, serif' }}>{pin}</strong></span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button className="ob-btn ob-btn-ghost" onClick={onBack} disabled={saving}>Atrás</button>
        <button className="ob-btn" onClick={handleFinish} style={{ background: '#7BA05B' }} disabled={saving}>
          {saving ? 'Guardando...' : 'Empezar a usar'} <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
}

function SummarySection({ title, people, showLock = false, showYoung = false, isPet = false, style = {} }) {
  return (
    <div style={style}>
      <div style={{ fontSize: '11px', color: '#8A7560', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{title}</div>
      {people.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
          {isPet ? (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{getPetEmoji(p.petType)}</div>
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'Fraunces, serif' }}>{p.name.charAt(0).toUpperCase()}</div>
          )}
          <span style={{ fontSize: '14px' }}>{p.name}</span>
          {isPet && <span style={{ fontSize: '11px', color: '#8A7560', fontStyle: 'italic', marginLeft: 'auto' }}>{getPetTypeLabel(p.petType)}</span>}
          {showLock && <Lock size={12} color="#8A7560" style={{ marginLeft: 'auto' }} />}
          {showYoung && p.young && <span style={{ fontSize: '10px', background: '#FFF4E0', color: '#A67C12', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, marginLeft: 'auto' }}>Simple</span>}
        </div>
      ))}
    </div>
  );
}
// ============================================================================
// MAIN APP
// ============================================================================

function MainApp({ familyCode, cloudData, syncStatus, onResetFamily }) {
  const safeData = normalizeFamilyData(cloudData);
  const familyConfig = safeData.config;
  const family = buildFamilyFromOnboarding(familyConfig);
  const adultKeys = familyConfig.adults.map(a => a.id);
  const kidKeys = familyConfig.kids.map(k => k.id);
  const youngKidKeys = familyConfig.kids.filter(k => k.young).map(k => k.id);
  const normalKidKeys = familyConfig.kids.filter(k => !k.young).map(k => k.id);
  const petKeys = familyConfig.pets.map(p => p.id);
  const bonusPct = familyConfig.bonusPct ?? DEFAULT_BONUS_PCT;
  const showMealBalance = familyConfig.showMealBalance !== false;

  const tasks = safeData.tasks;
  const routines = safeData.routines;
  const bigJobs = safeData.bigJobs;
  const events = safeData.events;
  const lists = safeData.lists;
  const meals = safeData.meals;
  const history = safeData.history;
  const jobInstances = safeData.jobInstances;
  const points = Object.keys(safeData.points).length > 0 ? safeData.points : (() => { const o = {}; kidKeys.forEach(k => o[k] = 0); return o; })();
  const money = Object.keys(safeData.money).length > 0 ? safeData.money : (() => { const o = {}; kidKeys.forEach(k => o[k] = 0); return o; })();

  const saveToCloud = (updates) => {
    const newData = {
      config: familyConfig,
      tasks, routines, bigJobs, events, lists, meals, points, money, history, jobInstances,
      ...updates,
    };
    saveFamilyData(familyCode, newData);
  };

  const setTasks = (v) => saveToCloud({ tasks: typeof v === 'function' ? v(tasks) : v });
  const setRoutines = (v) => saveToCloud({ routines: typeof v === 'function' ? v(routines) : v });
  const setBigJobs = (v) => saveToCloud({ bigJobs: typeof v === 'function' ? v(bigJobs) : v });
  const setEvents = (v) => saveToCloud({ events: typeof v === 'function' ? v(events) : v });
  const setLists = (v) => saveToCloud({ lists: typeof v === 'function' ? v(lists) : v });
  const setMeals = (v) => saveToCloud({ meals: typeof v === 'function' ? v(meals) : v });
  const setPoints = (v) => saveToCloud({ points: typeof v === 'function' ? v(points) : v });
  const setMoney = (v) => saveToCloud({ money: typeof v === 'function' ? v(money) : v });
  const setHistory = (v) => saveToCloud({ history: typeof v === 'function' ? v(history) : v });
  const setJobInstances = (v) => saveToCloud({ jobInstances: typeof v === 'function' ? v(jobInstances) : v });

  const setFamilyConfig = (newConfig) => {
    saveToCloud({ config: newConfig });
  };

  useEffect(() => {
    const stored = getStoredFamilyPin(familyCode);
    if (stored) {
      setInitialAdminPin(stored);
    }
  }, [familyCode]);

  const [activeUser, setActiveUser] = useState(() => {
    const stored = loadState('activeUser', null);
    if (stored && family[stored] && family[stored].role !== 'pet') return stored;
    return adultKeys[0];
  });
  useEffect(() => saveState('activeUser', activeUser), [activeUser]);

  const [activeTab, setActiveTab] = useState('today');
  const [time, setTime] = useState(new Date());
  const [confetti, setConfetti] = useState([]);
  const [bigCelebration, setBigCelebration] = useState(null);
  const [pointsAnimation, setPointsAnimation] = useState([]);
  const [modal, setModal] = useState(null);
  const [pinPrompt, setPinPrompt] = useState(null);
  const [viewFilter, setViewFilter] = useState('all');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { getLocation().then(loc => { setLocation(loc); fetchWeather(loc.lat, loc.lon).then(setWeather); }); }, []);

  const isAdmin = family[activeUser]?.isAdmin;
  const tk = todayKey();
  const today = new Date(); today.setHours(0,0,0,0);

  // Tareas: pueden ser individuales o compartidas (whoIds)
  // Para "todaysTasks" devolvemos cada tarea expandida por miembro al que aplica
  const todaysTasksRaw = tasks.filter(t => appliesOn(t, today));
  const expandTaskForMembers = (t) => {
    const members = itemMembers(t);
    if (members.length === 0) return [];
    return members.filter(m => family[m]).map(memberId => ({
      ...t,
      _displayWho: memberId,  // a quién se le muestra
      done: history.some(h => h.kind === 'task' && h.templateId === t.id && h.date === tk && h.who === memberId),
    }));
  };
  const todaysTasksExpanded = todaysTasksRaw.flatMap(expandTaskForMembers);

  const todaysEvents = events.filter(e => family[e.who] && appliesOn(e, today));

  // Rutinas: routines[member] (individual) + routines.shared (compartida)
  const todaysRoutinesFor = (kid) => {
    const direct = (routines[kid] || []);
    const shared = (routines.shared || []).filter(r => itemAppliesTo(r, kid));
    const all = [...direct, ...shared].filter(r => appliesOn(r, today));
    return all.map(r => ({
      ...r,
      done: history.some(h => h.kind === 'routine' && h.templateId === r.id && h.date === tk && h.who === kid),
    }));
  };

  const todaysJobs = bigJobs.filter(j => {
    if (!family[j.who]) return false;
    const hasInstance = jobInstances.some(i => i.jobId === j.id && i.date === tk);
    return hasInstance || appliesOn(j, today);
  }).map(j => {
    const inst = jobInstances.find(i => i.jobId === j.id && i.date === tk);
    return { ...j, instance: inst, status: inst?.status || 'pending' };
  });

  // Filtrado por vista. Para tareas, filtramos por _displayWho
  const filterTasksByView = (items) => viewFilter === 'all' ? items : items.filter(t => t._displayWho === viewFilter);
  const filterByView = (items, getWho) => viewFilter === 'all' ? items : items.filter(i => getWho(i) === viewFilter);

  const triggerConfetti = (x, y, color, intensity = 1) => {
    const particles = [];
    const colors = [color, '#F5B645', '#E87A93', '#F09872', '#7BA05B', '#E8804F', '#5B96B0'];
    for (let i = 0; i < Math.floor(20 * intensity); i++) {
      particles.push({ id: Math.random() + i, x, y, tx: (Math.random() - 0.5) * 350 * intensity, ty: -Math.random() * 280 - 80, rot: Math.random() * 720 - 360, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 8 + 6, shape: Math.random() > 0.5 ? '50%' : '2px' });
    }
    setConfetti(prev => [...prev, ...particles]);
    setTimeout(() => setConfetti(prev => prev.filter(p => !particles.find(np => np.id === p.id))), 1400);
  };
  const triggerPointsAnimation = (x, y, who, value = 1) => {
    const id = Math.random();
    setPointsAnimation(prev => [...prev, { id, x, y, color: family[who].color, value }]);
    setTimeout(() => setPointsAnimation(prev => prev.filter(p => p.id !== id)), 1600);
  };
  const triggerBigCelebration = (kidName, color, message) => {
    setBigCelebration({ name: kidName, color, message });
    setTimeout(() => setBigCelebration(null), 2800);
  };

  // Toggle de tarea: para una tarea compartida, cada persona tiene su propio "done"
  const toggleTask = (taskId, displayWho, e) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const existing = history.find(h => h.kind === 'task' && h.templateId === taskId && h.date === tk && h.who === displayWho);
    if (existing) {
      saveToCloud({ history: history.filter(h => h.id !== existing.id) });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[displayWho]?.color || '#3D2E1F');
      saveToCloud({ history: [...history, { id: Date.now(), kind: 'task', templateId: taskId, date: tk, who: displayWho }] });
    }
  };

  const toggleRoutine = (kid, itemId, e) => {
    const todays = todaysRoutinesFor(kid);
    const item = todays.find(r => r.id === itemId);
    if (!item) return;
    const itemPoints = item.points || 1;
    const totalDayPoints = todays.reduce((s, r) => s + (r.points || 1), 0);
    const dayBonus = Math.round(totalDayPoints * bonusPct / 100);
    const existing = history.find(h => h.kind === 'routine' && h.templateId === itemId && h.date === tk && h.who === kid);

    if (existing) {
      const wasAllDone = todays.every(r => r.done);
      let toSubtract = itemPoints;
      if (wasAllDone && dayBonus > 0) toSubtract += dayBonus;
      saveToCloud({
        history: history.filter(h => h.id !== existing.id),
        points: { ...points, [kid]: Math.max(0, (points[kid] || 0) - toSubtract) },
      });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const willAllBeDone = todays.every(r => r.id === itemId || r.done);
      triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[kid].color);
      triggerPointsAnimation(rect.left + rect.width/2, rect.top + rect.height/2, kid, itemPoints);
      let toAdd = itemPoints;
      if (willAllBeDone && dayBonus > 0) {
        toAdd += dayBonus;
        triggerBigCelebration(family[kid].name, family[kid].color, `¡Rutina completa! +${dayBonus} bonus`);
      }
      saveToCloud({
        history: [...history, { id: Date.now(), kind: 'routine', templateId: itemId, date: tk, who: kid, points: itemPoints }],
        points: { ...points, [kid]: (points[kid] || 0) + toAdd },
      });
    }
  };

  const toggleListItem = (listId, itemId, e) => {
    const list = lists.find(l => l.id === listId);
    const item = list.items.find(i => i.id === itemId);
    if (!item.done) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, '#E8804F', 0.6);
    }
    setLists(lists.map(l => l.id === listId ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : l));
  };

  const submitJob = (jobId, e) => {
    const job = bigJobs.find(j => j.id === jobId);
    const rect = e.currentTarget.getBoundingClientRect();
    triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[job.who].color, 0.8);
    const existing = jobInstances.find(i => i.jobId === jobId && i.date === tk);
    let newJobInstances;
    if (existing) newJobInstances = jobInstances.map(i => i.id === existing.id ? { ...i, status: 'review' } : i);
    else newJobInstances = [...jobInstances, { id: `j${jobId}-${tk}`, jobId, date: tk, status: 'review' }];
    saveToCloud({ jobInstances: newJobInstances });
  };

  const validateJob = (jobId, e) => {
    if (!isAdmin) {
      const rect = e?.currentTarget?.getBoundingClientRect();
      requestPin(() => actuallyValidateJob(jobId, rect));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    actuallyValidateJob(jobId, rect);
  };
  const actuallyValidateJob = (jobId, rect) => {
    const job = bigJobs.find(j => j.id === jobId);
    if (rect) triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[job.who].color, 1.5);
    triggerBigCelebration(family[job.who].name, family[job.who].color, job.reward.type === 'money' ? `+${formatMoney(job.reward.value)}` : `+${job.reward.value} puntos`);
    const updates = {
      jobInstances: jobInstances.map(i => (i.jobId === jobId && i.date === tk) ? { ...i, status: 'done' } : i),
      history: [...history, { id: Date.now(), kind: 'job', templateId: jobId, date: tk, who: job.who, title: job.title, ...(job.reward.type === 'points' ? { points: job.reward.value } : { money: job.reward.value })}],
    };
    if (job.reward.type === 'points') updates.points = { ...points, [job.who]: (points[job.who] || 0) + job.reward.value };
    else updates.money = { ...money, [job.who]: (money[job.who] || 0) + job.reward.value };
    saveToCloud(updates);
  };
  const rejectJob = (jobId) => {
    const apply = () => saveToCloud({ jobInstances: jobInstances.map(i => (i.jobId === jobId && i.date === tk) ? { ...i, status: 'pending' } : i) });
    if (!isAdmin) requestPin(apply);
    else apply();
  };

  const requestPin = (onSuccess) => setPinPrompt({ onSuccess });
  const tryAdminLogin = (userId) => {
    if (family[userId]?.role === 'pet') return;
    if (family[userId]?.isAdmin) requestPin(() => setActiveUser(userId));
    else setActiveUser(userId);
  };

  // ===== TAREAS =====
  // Pueden ser individuales (who) o compartidas (whoIds con > 1)
  const saveTask = (data) => {
    const isCompartida = Array.isArray(data.whoIds) && data.whoIds.length > 1;
    let payload;
    if (isCompartida) {
      payload = { ...data, whoIds: data.whoIds, who: undefined };
    } else if (Array.isArray(data.whoIds) && data.whoIds.length === 1) {
      payload = { ...data, who: data.whoIds[0], whoIds: undefined };
    } else {
      payload = data;
    }
    if (data.id) setTasks(tasks.map(t => t.id === data.id ? { ...t, ...payload } : t));
    else setTasks([...tasks, { ...payload, id: Date.now() }]);
    setModal(null);
  };
  const deleteTask = (id) => { setTasks(tasks.filter(t => t.id !== id)); setModal(null); };

  const saveJob = (data) => {
    if (data.id) setBigJobs(bigJobs.map(j => j.id === data.id ? { ...j, ...data } : j));
    else setBigJobs([...bigJobs, { ...data, id: Date.now() }]);
    setModal(null);
  };
  const deleteJob = (id) => { setBigJobs(bigJobs.filter(j => j.id !== id)); setModal(null); };

  const saveEvent = (data) => {
    if (data.id) setEvents(events.map(e => e.id === data.id ? { ...e, ...data } : e));
    else setEvents([...events, { ...data, id: Date.now() }]);
    setModal(null);
  };
  const deleteEvent = (id) => { setEvents(events.filter(e => e.id !== id)); setModal(null); };

  // ===== RUTINAS =====
  const saveRoutineItem = (member, data) => {
    const isCompartida = Array.isArray(data.whoIds) && data.whoIds.length > 1;
    if (isCompartida) {
      const sharedList = routines.shared || [];
      let newShared;
      if (data.id) {
        const existsInShared = sharedList.some(r => r.id === data.id);
        if (existsInShared) {
          newShared = sharedList.map(r => r.id === data.id ? { ...r, ...data } : r);
          setRoutines({ ...routines, shared: newShared });
        } else {
          const newMemberRoutines = (routines[member] || []).filter(r => r.id !== data.id);
          setRoutines({ ...routines, [member]: newMemberRoutines, shared: [...sharedList, { ...data }] });
        }
      } else {
        newShared = [...sharedList, { ...data, id: Date.now() }];
        setRoutines({ ...routines, shared: newShared });
      }
    } else {
      const targetMember = (data.whoIds && data.whoIds[0]) || member;
      const sharedList = routines.shared || [];
      const existsInShared = data.id ? sharedList.some(r => r.id === data.id) : false;
      if (existsInShared) {
        const newShared = sharedList.filter(r => r.id !== data.id);
        const targetCurrent = routines[targetMember] || [];
        setRoutines({ ...routines, shared: newShared, [targetMember]: [...targetCurrent, { ...data }] });
      } else {
        const current = routines[targetMember] || [];
        if (data.id) {
          setRoutines({ ...routines, [targetMember]: current.map(r => r.id === data.id ? { ...r, ...data } : r) });
        } else {
          setRoutines({ ...routines, [targetMember]: [...current, { ...data, id: Date.now() }] });
        }
      }
    }
    setModal(null);
  };

  const deleteRoutineItem = (member, id) => {
    const sharedList = routines.shared || [];
    if (sharedList.some(r => r.id === id)) {
      setRoutines({ ...routines, shared: sharedList.filter(r => r.id !== id) });
    } else {
      setRoutines({ ...routines, [member]: (routines[member] || []).filter(r => r.id !== id) });
    }
    setModal(null);
  };

  const applyTemplate = (template, targetMemberIds) => {
    if (!Array.isArray(targetMemberIds) || targetMemberIds.length === 0) return;
    const isCompartida = targetMemberIds.length > 1;
    const newItems = template.steps.map((step, idx) => ({
      id: Date.now() + idx,
      ...(step.label !== undefined ? { label: step.label } : { text: step.text }),
      icon: step.icon,
      points: step.points || 1,
      timeOfDay: template.timeOfDay || 'any',
      recurrence: { type: 'daily', startDate: todayKey() },
      ...(isCompartida ? { whoIds: targetMemberIds } : {}),
    }));

    if (isCompartida) {
      const sharedList = routines.shared || [];
      setRoutines({ ...routines, shared: [...sharedList, ...newItems] });
    } else {
      const targetMember = targetMemberIds[0];
      const current = routines[targetMember] || [];
      setRoutines({ ...routines, [targetMember]: [...current, ...newItems] });
    }
    setModal(null);
  };

  // ===== LISTAS =====
  const saveList = (data) => {
    if (data.id) setLists(lists.map(l => l.id === data.id ? { ...l, name: data.name, icon: data.icon } : l));
    else setLists([...lists, { ...data, id: Date.now(), items: [] }]);
    setModal(null);
  };
  const deleteList = (id) => { setLists(lists.filter(l => l.id !== id)); setModal(null); };
  const saveListItem = (listId, itemData) => {
    setLists(lists.map(l => {
      if (l.id !== listId) return l;
      if (itemData.id) return { ...l, items: l.items.map(i => i.id === itemData.id ? { ...i, ...itemData } : i) };
      return { ...l, items: [...l.items, { ...itemData, id: Date.now(), done: false }] };
    }));
    setModal(null);
  };
  const deleteListItem = (listId, itemId) => setLists(lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l));
  const clearCompletedItems = (listId) => setLists(lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => !i.done) } : l));

  // ===== MENÚ DE COMIDAS =====
  // meals tiene esta forma: { 'YYYY-MM-DD': { lunch: {id, name, custom}, dinner: {...} } }
  const setMealForDate = (dKey, slot, mealData) => {
    const newMeals = { ...meals };
    if (!newMeals[dKey]) newMeals[dKey] = {};
    if (mealData === null) {
      delete newMeals[dKey][slot];
      if (Object.keys(newMeals[dKey]).length === 0) delete newMeals[dKey];
    } else {
      newMeals[dKey] = { ...newMeals[dKey], [slot]: mealData };
    }
    setMeals(newMeals);
  };

  const toggleMealBalance = () => {
    setFamilyConfig({ ...familyConfig, showMealBalance: !showMealBalance });
  };

  // ===== CONFIG =====
  const updateFamilyConfig = (newConfig) => {
    const allNewIds = [...newConfig.adults, ...newConfig.kids, ...newConfig.helpers, ...(newConfig.pets || [])].map(p => p.id);
    const newKidKeys = newConfig.kids.map(k => k.id);
    const cleanedRoutines = {};
    Object.keys(routines).forEach(k => {
      if (k === 'shared') {
        const cleaned = (routines.shared || []).map(r => ({
          ...r,
          whoIds: (r.whoIds || []).filter(id => allNewIds.includes(id)),
        })).filter(r => r.whoIds.length > 0);
        cleanedRoutines.shared = cleaned;
      } else if (allNewIds.includes(k)) {
        cleanedRoutines[k] = routines[k];
      }
    });
    const cleanedPoints = {};
    newKidKeys.forEach(k => { cleanedPoints[k] = points[k] || 0; });
    const cleanedMoney = {};
    newKidKeys.forEach(k => { cleanedMoney[k] = money[k] || 0; });
    // Limpiar tareas: si tiene whoIds, filtrar miembros válidos; si sólo tiene who, validar
    const cleanedTasks = tasks.map(t => {
      if (Array.isArray(t.whoIds)) {
        const valid = t.whoIds.filter(id => allNewIds.includes(id));
        if (valid.length === 0) return null;
        return { ...t, whoIds: valid, who: valid.length === 1 ? valid[0] : undefined };
      }
      return allNewIds.includes(t.who) ? t : null;
    }).filter(Boolean);
    saveToCloud({
      config: newConfig,
      tasks: cleanedTasks,
      bigJobs: bigJobs.filter(j => allNewIds.includes(j.who)),
      events: events.filter(e => allNewIds.includes(e.who)),
      history: history.filter(h => allNewIds.includes(h.who)),
      routines: cleanedRoutines,
      points: cleanedPoints,
      money: cleanedMoney,
    });
    if (!allNewIds.includes(activeUser) || family[activeUser]?.role === 'pet') {
      setActiveUser(newConfig.adults[0]?.id || allNewIds[0]);
    }
  };

  const w = weather ? weatherCodeToInfo(weather.code) : null;

  const peopleEntries = Object.entries(family).filter(([k, m]) => m.role !== 'pet');
  const petEntries = Object.entries(family).filter(([k, m]) => m.role === 'pet');

  return (
    <div style={{ fontFamily: '"DM Sans", -apple-system, sans-serif', background: '#FDFAF3', minHeight: '100vh', color: '#3D2E1F', position: 'relative', overflowX: 'hidden' }}>
      <MainStyles />
      {confetti.map(p => (<div key={p.id} className="confetti-particle" style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: p.color, borderRadius: p.shape, '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--rot': `${p.rot}deg` }}/>))}
      {pointsAnimation.map(p => (<div key={p.id} className="points-fly" style={{ left: p.x, top: p.y, color: p.color }}>+{p.value} pt</div>))}
      {bigCelebration && (
        <div className="big-celebration">
          <div style={{ background: 'white', borderRadius: '32px', padding: '40px 60px', boxShadow: `0 20px 60px ${bigCelebration.color}40`, textAlign: 'center', minWidth: '300px', maxWidth: '92vw' }}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎉</div>
            <div className="serif" style={{ fontSize: '32px', fontWeight: 700, color: bigCelebration.color, marginBottom: '6px' }}>¡Bien {bigCelebration.name}!</div>
            <div style={{ fontSize: '16px', color: '#8A7560', fontWeight: 500 }}>{bigCelebration.message}</div>
          </div>
        </div>
      )}

      <div className="app-container">
        <div className="header-row">
          <div className="header-left">
            <div className="serif clock">{formatTime(time)}</div>
            <div className="date-text">{formatDate(time)}</div>
          </div>
          <div className="header-center" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="serif logo-symbol">✦</span>
            <span className="serif logo-text">Bendita Rutina</span>
          </div>
          <div className="header-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div className="user-switcher">
              {peopleEntries.map(([k, m]) => (
                <button key={k} onClick={() => tryAdminLogin(k)} className={activeUser === k ? 'active' : ''} style={{ background: m.color }} title={m.name}>
                  {m.initial}
                  {m.isAdmin && <Lock size={10} style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'white', borderRadius: '50%', padding: '2px', color: '#3D2E1F' }} />}
                </button>
              ))}
              {petEntries.map(([k, m]) => (
                <div key={k} title={`${m.name} (${getPetTypeLabel(m.petType)})`} style={{ background: m.color, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', cursor: 'default' }}>
                  {m.emoji}
                </div>
              ))}
              {isAdmin && <button onClick={() => setShowSettings(true)} title="Ajustes" style={{ background: '#8A7560', width: '34px', height: '34px' }}><SettingsIcon size={16} /></button>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <SyncIndicator status={syncStatus} />
              {weather && w && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 14px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(61,46,31,0.04)' }}>
                  <div style={{ fontSize: '24px' }}>{w.emoji}</div>
                  <div>
                    <div className="serif" style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>{weather.temp}°</div>
                    <div style={{ fontSize: '10px', color: '#8A7560', marginTop: '2px' }}>{location?.name || 'Tu zona'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="view-bar">
          <Eye size={14} color="#8A7560" />
          <span style={{ fontSize: '12px', color: '#8A7560', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Ver:</span>
          <button onClick={() => setViewFilter('all')} className="pill" style={{ background: viewFilter === 'all' ? '#3D2E1F' : 'white', color: viewFilter === 'all' ? '#FDFAF3' : '#3D2E1F', border: viewFilter === 'all' ? 'none' : '1px solid #D4C5B0', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 14px', fontWeight: 600 }}>Todo</button>
          {Object.entries(family).map(([k, m]) => (
            <button key={k} onClick={() => setViewFilter(k)} className="pill" style={{ background: viewFilter === k ? m.color : 'white', color: viewFilter === k ? 'white' : '#3D2E1F', border: viewFilter === k ? 'none' : '1px solid #D4C5B0', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {m.role === 'pet' && <span>{m.emoji}</span>}
              {m.name}
            </button>
          ))}
        </div>

        <div className="main-content">
          {activeTab === 'today'    && <TodayView family={family} kidKeys={kidKeys} events={filterByView(todaysEvents, e => e.who)} tasks={filterTasksByView(todaysTasksExpanded)} points={points} toggleTask={toggleTask} />}
          {activeTab === 'calendar' && <CalendarView family={family} events={filterByView(events, e => e.who)} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'tasks'    && <TasksView family={family} tasks={filterTasksByView(todaysTasksExpanded)} toggleTask={toggleTask} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'routines' && <RoutinesView family={family} normalKidKeys={normalKidKeys} youngKidKeys={youngKidKeys} kidKeys={kidKeys} routines={routines} todaysRoutinesFor={todaysRoutinesFor} toggleRoutine={toggleRoutine} points={points} isAdmin={isAdmin} setModal={setModal} viewFilter={viewFilter} />}
          {activeTab === 'jobs'     && <JobsView family={family} kidKeys={kidKeys} bigJobs={bigJobs} todaysJobs={filterByView(todaysJobs, j => j.who)} submitJob={submitJob} validateJob={validateJob} rejectJob={rejectJob} money={money} points={points} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'meals'    && <MealsView meals={meals} setMealForDate={setMealForDate} showBalance={showMealBalance} toggleBalance={toggleMealBalance} familySize={familyConfig.adults.length + familyConfig.kids.length} isAdmin={isAdmin} />}
          {activeTab === 'lists'    && <ListsView lists={lists} toggleListItem={toggleListItem} deleteListItem={deleteListItem} clearCompletedItems={clearCompletedItems} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'history'  && <HistoryView family={family} kidKeys={kidKeys} history={history} tasks={tasks} bigJobs={bigJobs} routines={routines} viewFilter={viewFilter} />}
        </div>
      </div>

      <div className="bottom-nav">
        {[
          { id: 'today', label: 'Hoy', icon: Home },
          { id: 'calendar', label: 'Calendario', icon: Calendar },
          { id: 'tasks', label: 'Tareas', icon: CheckSquare },
          { id: 'routines', label: 'Rutinas', icon: Sparkles },
          { id: 'jobs', label: 'Trabajos', icon: Briefcase },
          { id: 'meals', label: 'Menú', icon: UtensilsCrossed },
          { id: 'lists', label: 'Listas', icon: ListTodo },
          { id: 'history', label: 'Historial', icon: HistoryIcon },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={18} /><span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {modal && modal.type === 'task' && <TaskModal data={modal.data} family={family} onSave={saveTask} onDelete={deleteTask} onClose={() => setModal(null)} />}
      {modal && modal.type === 'job' && <JobModal data={modal.data} family={family} kidKeys={kidKeys} onSave={saveJob} onDelete={deleteJob} onClose={() => setModal(null)} />}
      {modal && modal.type === 'event' && <EventModal data={modal.data} family={family} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)} />}
      {modal && modal.type === 'routine' && <RoutineModal data={modal.data} member={modal.member} memberData={family[modal.member]} family={family} kidKeys={kidKeys} onSave={(d) => saveRoutineItem(modal.member, d)} onDelete={(id) => deleteRoutineItem(modal.member, id)} onClose={() => setModal(null)} />}
      {modal && modal.type === 'routineTemplates' && <RoutineTemplatesModal member={modal.member} memberData={family[modal.member]} family={family} kidKeys={kidKeys} onApply={applyTemplate} onClose={() => setModal(null)} onCreateBlank={() => setModal({ type: 'routine', member: modal.member, data: null })} />}
      {modal && modal.type === 'list' && <ListModal data={modal.data} onSave={saveList} onDelete={deleteList} onClose={() => setModal(null)} />}
      {modal && modal.type === 'listItem' && <ListItemModal data={modal.data} listId={modal.listId} onSave={(d) => saveListItem(modal.listId, d)} onClose={() => setModal(null)} />}
      {modal && modal.type === 'mealPicker' && <MealPickerModal initialDate={modal.dateKey} initialSlot={modal.slot} initialMeal={modal.meal} onSelect={(dKey, slot, meal) => setMealForDate(dKey, slot, meal)} onClose={() => setModal(null)} />}
      {pinPrompt && <PinPrompt onSuccess={() => { pinPrompt.onSuccess(); setPinPrompt(null); }} onCancel={() => setPinPrompt(null)} />}
      {showSettings && <SettingsModal config={familyConfig} familyCode={familyCode} onUpdate={updateFamilyConfig} onClose={() => setShowSettings(false)} onResetFamily={onResetFamily} />}
    </div>
  );
}

function SyncIndicator({ status }) {
  if (status === 'connected') {
    return (
      <div title="Sincronizado con la nube" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EDF4E2', color: '#3D5C26', padding: '6px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>
        <Cloud size={12} /> Sincronizado
      </div>
    );
  }
  if (status === 'connecting') {
    return (
      <div title="Conectando..." style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFF4E0', color: '#A67C12', padding: '6px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>
        <Wifi size={12} /> Conectando...
      </div>
    );
  }
  return (
    <div title="Sin conexión" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FCEBE6', color: '#C0392B', padding: '6px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>
      <CloudOff size={12} /> Sin conexión
    </div>
  );
}

function MainStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { margin: 0; }
      html { -webkit-text-size-adjust: 100%; }
      .serif { font-family: 'Fraunces', Georgia, serif; }
      .card { background: #FFFFFF; border-radius: 22px; padding: 24px; box-shadow: 0 1px 3px rgba(61,46,31,0.04), 0 2px 8px rgba(61,46,31,0.04); }
      .tab-btn { background: transparent; border: none; cursor: pointer; padding: 10px 12px; border-radius: 12px; color: #8A7560; font-family: inherit; font-size: 12px; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.2s ease; min-width: 56px; }
      .tab-btn.active { background: #3D2E1F; color: #FDFAF3; }
      .tab-btn:hover:not(.active) { background: rgba(61,46,31,0.06); color: #3D2E1F; }
      .checkbox { width: 26px; height: 26px; border-radius: 8px; border: 2px solid #D4C5B0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; flex-shrink: 0; }
      .checkbox.done { background: #3D2E1F; border-color: #3D2E1F; transform: scale(1.05); }
      .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; }
      .pill { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
      .btn-primary { background: #3D2E1F; color: #FDFAF3; border: none; border-radius: 12px; padding: 10px 16px; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .btn-secondary { background: #7BA05B; color: white; border: none; border-radius: 12px; padding: 10px 16px; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .btn-success { background: #7BA05B; color: white; border: none; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
      .btn-ghost { background: transparent; color: #8A7560; border: 1px solid #D4C5B0; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; cursor: pointer; }
      .btn-danger { background: transparent; color: #C0392B; border: 1px solid #E8B5AD; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .input { width: 100%; padding: 12px 14px; border: 1.5px solid #E8DEC9; border-radius: 12px; font-family: inherit; font-size: 14px; background: #FBF5E9; color: #3D2E1F; outline: none; }
      .input:focus { border-color: #3D2E1F; background: white; }
      .label { display: block; font-size: 12px; font-weight: 600; color: #8A7560; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
      .field { margin-bottom: 18px; }
      .recurrence-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #8A7560; background: #F5EFE6; padding: 3px 8px; border-radius: 999px; font-weight: 500; }
      .points-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #A67C12; background: #FFF4E0; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
      .shared-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: #5C7D42; background: #EDF4E2; padding: 2px 7px; border-radius: 999px; font-weight: 600; }
      .time-pill { padding: 8px 14px; border-radius: 999px; cursor: pointer; font-size: 13px; font-weight: 600; border: 1.5px solid #E8DEC9; background: white; color: #3D2E1F; display: inline-flex; align-items: center; gap: 6px; }
      .time-pill.selected { background: #3D2E1F; color: white; border-color: #3D2E1F; }
      @keyframes confettiFly { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; } }
      @keyframes pointsRise { 0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; } 15% { transform: translate(-50%, -10px) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -90px) scale(1); opacity: 0; } }
      @keyframes bigPop { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0; } 15% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; } 25% { transform: translate(-50%,-50%) scale(1); opacity: 1; } 85% { transform: translate(-50%,-50%) scale(1); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(0.9); opacity: 0; } }
      @keyframes modalIn { 0% { opacity: 0; transform: scale(0.92) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes overlayIn { 0% { opacity: 0; } 100% { opacity: 1; } }
      .confetti-particle { position: fixed; pointer-events: none; z-index: 9999; animation: confettiFly 1.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
      .points-fly { position: fixed; pointer-events: none; z-index: 9999; font-family: 'Fraunces', serif; font-weight: 700; font-size: 24px; animation: pointsRise 1.6s ease-out forwards; }
      .big-celebration { position: fixed; top: 50%; left: 50%; z-index: 9998; animation: bigPop 2.8s ease-out forwards; pointer-events: none; }
      .modal-overlay { position: fixed; inset: 0; background: rgba(61,46,31,0.45); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: overlayIn 0.2s ease-out; padding: 12px; }
      .modal-box { background: #FDFAF3; border-radius: 24px; max-width: 560px; width: 100%; max-height: 92vh; overflow-y: auto; padding: 28px; animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 30px 80px rgba(61,46,31,0.25); }
      .icon-picker-btn { width: 48px; height: 48px; border-radius: 12px; border: 2px solid #E8DEC9; background: white; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .icon-picker-btn.selected { border-color: #3D2E1F; background: #3D2E1F; transform: scale(1.05); }
      .person-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; cursor: pointer; border: 2px solid transparent; background: #FBF5E9; font-size: 13px; font-weight: 500; }
      .person-chip.selected { background: white; border-color: var(--clr); }
      .toggle-pill { padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 13px; border: 2px solid #E8DEC9; background: white; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
      .toggle-pill.selected { border-color: #3D2E1F; background: #3D2E1F; color: white; }
      .day-pill { width: 38px; height: 38px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 12px; border: 2px solid #E8DEC9; background: white; display: flex; align-items: center; justify-content: center; }
      .day-pill.selected { border-color: #3D2E1F; background: #3D2E1F; color: white; }
      .user-switcher { display: flex; align-items: center; gap: 6px; padding: 6px; background: white; border-radius: 999px; box-shadow: 0 1px 3px rgba(61,46,31,0.06); flex-wrap: wrap; }
      .user-switcher button { width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 13px; position: relative; }
      .user-switcher button.active { transform: scale(1.15); box-shadow: 0 0 0 2px white, 0 0 0 4px #3D2E1F; }
      .pin-input { width: 180px; height: 70px; border: 2px solid #E8DEC9; border-radius: 14px; text-align: center; font-size: 32px; font-weight: 700; font-family: 'Fraunces', serif; background: white; color: #3D2E1F; }
      .pin-input:focus { border-color: #3D2E1F; outline: none; }
      .points-picker-btn { width: 38px; height: 38px; border-radius: 10px; cursor: pointer; font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; border: 2px solid #E8DEC9; background: white; color: #3D2E1F; transition: all 0.15s; }
      .points-picker-btn.selected { border-color: #3D2E1F; background: #3D2E1F; color: #FDFAF3; transform: scale(1.05); }
      .editor-section { background: white; border-radius: 14px; padding: 16px; margin-bottom: 12px; }
      .editor-row { background: #FBF5E9; padding: 12px; border-radius: 10px; margin-bottom: 8px; }
      .tab-pill { padding: 8px 14px; border-radius: 999px; cursor: pointer; font-size: 13px; font-weight: 600; border: 1.5px solid #E8DEC9; background: white; color: #3D2E1F; }
      .tab-pill.selected { background: #3D2E1F; color: white; border-color: #3D2E1F; }
      .template-card { background: white; border: 2px solid #E8DEC9; border-radius: 16px; padding: 16px; cursor: pointer; transition: all 0.15s; text-align: left; font-family: inherit; color: #3D2E1F; width: 100%; }
      .template-card:hover { border-color: #3D2E1F; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(61,46,31,0.1); }
      .template-card.selected { border-color: #3D2E1F; background: #FBF5E9; }
      .meal-day-cell { background: white; border: 1px solid #E8DEC9; border-radius: 10px; padding: 6px; min-height: 70px; display: flex; flex-direction: column; gap: 4px; transition: all 0.15s; }
      .meal-day-cell.today { border-color: #3D2E1F; border-width: 2px; }
      .meal-day-cell.other-month { opacity: 0.35; }
      .meal-slot { background: #FBF5E9; border-radius: 6px; padding: 4px 6px; font-size: 10px; cursor: pointer; line-height: 1.2; min-height: 22px; display: flex; align-items: center; gap: 4px; }
      .meal-slot.empty { background: transparent; border: 1px dashed #D4C5B0; color: #B8A78C; justify-content: center; }
      .meal-slot:hover { background: #F5EFE6; }
      .meal-slot.empty:hover { background: #FBF5E9; }
      .app-container { max-width: 1600px; margin: 0 auto; }
      .header-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 24px; padding: 20px 32px 16px; }
      .header-row > .header-left { justify-self: start; }
      .header-row > .header-center { justify-self: center; padding-bottom: 4px; }
      .header-row > .header-right { justify-self: end; }
      .clock { font-size: 50px; font-weight: 600; line-height: 1; }
      .date-text { font-size: 15px; color: #8A7560; margin-top: 6px; text-transform: capitalize; }
      .logo-text { font-size: 26px; font-weight: 600; color: #3D2E1F; letter-spacing: 0.02em; }
      .logo-symbol { font-size: 26px; font-weight: 500; color: #3D2E1F; }
      .view-bar { padding: 0 32px 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .main-content { padding: 0 32px 110px; }
      .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(253,250,243,0.92); backdrop-filter: blur(20px); border-top: 1px solid rgba(61,46,31,0.08); padding: 10px 12px; display: flex; justify-content: center; gap: 2px; flex-wrap: wrap; z-index: 50; }
      @media (max-width: 1280px) { .clock { font-size: 42px; } .logo-text, .logo-symbol { font-size: 22px; } .header-row { padding: 16px 24px 12px; gap: 16px; } .view-bar { padding: 0 24px 12px; } .main-content { padding: 0 24px 110px; } }
      @media (max-width: 1024px) { .clock { font-size: 38px; } .date-text { font-size: 14px; } .logo-text, .logo-symbol { font-size: 20px; } .header-row { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; align-items: start; gap: 12px; padding: 14px 20px 10px; } .header-row > .header-left { grid-column: 1; grid-row: 1; } .header-row > .header-right { grid-column: 2; grid-row: 1; } .header-row > .header-center { grid-column: 1 / -1; grid-row: 2; justify-self: center; padding: 0; margin-top: 4px; } .view-bar { padding: 0 20px 12px; } .main-content { padding: 0 20px 100px; } .tab-btn { padding: 8px 10px; font-size: 11px; min-width: 52px; } }
      @media (max-width: 900px) { .clock { font-size: 34px; } .header-row { grid-template-columns: 1fr; grid-template-rows: auto auto auto; gap: 8px; padding: 12px 16px 8px; } .header-row > .header-left, .header-row > .header-right { grid-column: 1; justify-self: stretch; } .header-row > .header-center { grid-column: 1; grid-row: 1; justify-self: center; margin-bottom: 2px; } .header-row > .header-left { grid-row: 2; } .header-row > .header-right { grid-row: 3; display: flex !important; flex-direction: row !important; justify-content: space-between !important; align-items: center !important; gap: 8px !important; } .view-bar { padding: 0 16px 10px; gap: 6px; } .main-content { padding: 0 16px 96px; } .card { padding: 18px; border-radius: 18px; } .tab-btn span { font-size: 10px; } }
      @media (max-width: 500px) { .clock { font-size: 30px; } .date-text { font-size: 13px; } .logo-text, .logo-symbol { font-size: 18px; } .header-row { padding: 10px 12px 6px; } .view-bar { padding: 0 12px 8px; gap: 5px; } .view-bar .pill { padding: 5px 10px !important; font-size: 11px; } .main-content { padding: 0 12px 90px; } .card { padding: 14px; border-radius: 16px; } .bottom-nav { padding: 8px 4px; gap: 0; } .tab-btn { padding: 6px 2px; min-width: 0; flex: 1; } .tab-btn span { font-size: 9px; } .modal-box { padding: 20px; border-radius: 18px; } .pin-input { width: 160px; height: 60px; font-size: 26px; } .user-switcher button { width: 32px; height: 32px; font-size: 12px; } .avatar { width: 32px; height: 32px; font-size: 13px; } }
    `}</style>
  );
}
// ============================================================================
// VIEWS
// ============================================================================

function TodayView({ family, kidKeys, events, tasks, points, toggleTask }) {
  const pendingTasks = tasks.filter(t => !t.done).slice(0, 6);
  const ranking = kidKeys.map(k => ({ k, ...family[k], pts: points[k] || 0 })).sort((a,b) => b.pts - a.pts);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      <div className="card">
        <div className="serif" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>El día de hoy</div>
        {events.length === 0 && <div style={{ color: '#8A7560', fontSize: '14px' }}>No hay eventos para hoy.</div>}
        {events.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #F5EFE6' }}>
            <div style={{ minWidth: '54px' }}>
              <div className="serif" style={{ fontSize: '18px', fontWeight: 600 }}>{e.time}</div>
              <div style={{ fontSize: '11px', color: '#8A7560' }}>{e.duration}</div>
            </div>
            <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: family[e.who]?.color || '#999', flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>{e.title}</div>
              <div style={{ fontSize: '12px', color: '#8A7560', marginTop: '2px' }}>{family[e.who]?.name}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {kidKeys.length > 0 && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #FFF8EE 0%, #FFEED1 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Trophy size={20} color="#F5B645" />
              <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>Ranking del mes</div>
            </div>
            {ranking.map((r, i) => (
              <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                <div style={{ fontSize: '20px', width: '24px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '·'}</div>
                <div className="avatar" style={{ background: r.color, width: '28px', height: '28px', fontSize: '12px' }}>{r.initial}</div>
                <div style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{r.name}</div>
                <div className="serif" style={{ fontSize: '18px', fontWeight: 700, color: r.color }}>{r.pts}</div>
              </div>
            ))}
          </div>
        )}
        <div className="card">
          <div className="serif" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '14px' }}>Pendientes</div>
          {pendingTasks.length === 0 && <div style={{ color: '#8A7560', fontSize: '13px' }}>Todo listo por hoy ✨</div>}
          {pendingTasks.map(t => (
            <div key={`${t.id}-${t._displayWho}`} onClick={(e) => toggleTask(t.id, t._displayWho, e)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', cursor: 'pointer' }}>
              <div className={`checkbox ${t.done ? 'done' : ''}`}>{t.done && <Check size={16} color="#FDFAF3" strokeWidth={3} />}</div>
              <div style={{ flex: 1, fontSize: '14px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.text}
                {isSharedItem(t) && <span className="shared-badge" style={{ marginLeft: '6px' }}><Users size={9} /> Compartida</span>}
              </div>
              <div className="avatar" style={{ background: family[t._displayWho]?.color || '#999', width: '28px', height: '28px', fontSize: '12px' }}>
                {family[t._displayWho]?.role === 'pet' ? family[t._displayWho].emoji : family[t._displayWho]?.initial}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarView({ family, events, isAdmin, setModal }) {
  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const todayDow = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const dates = []; const weekDates = [];
  for (let i = -todayDow; i < 7 - todayDow; i++) {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0,0,0,0);
    dates.push(d.getDate()); weekDates.push(d);
  }
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '28px', fontWeight: 600 }}>Esta semana</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'event', data: null })}><Plus size={16} /> Nuevo evento</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px', overflowX: 'auto' }}>
        {days.map((d, i) => {
          const dayEvents = events.filter(e => appliesOn(e, weekDates[i])).sort((a,b) => a.time.localeCompare(b.time));
          const isToday = i === todayDow;
          return (
            <div key={d} style={{ background: isToday ? '#3D2E1F' : '#FBF5E9', color: isToday ? '#FDFAF3' : '#3D2E1F', borderRadius: '12px', padding: '10px 6px', minHeight: '160px', minWidth: 0 }}>
              <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 500 }}>{d}</div>
              <div className="serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>{dates[i]}</div>
              {dayEvents.map((e, j) => (
                <div key={j} onClick={() => isAdmin && setModal({ type: 'event', data: e })} style={{ background: isToday ? 'rgba(253,250,243,0.12)' : 'white', borderLeft: `3px solid ${family[e.who]?.color || '#999'}`, padding: '3px 5px', borderRadius: '5px', marginBottom: '3px', cursor: isAdmin ? 'pointer' : 'default', overflow: 'hidden' }}>
                  <div style={{ fontSize: '8px', opacity: 0.6 }}>{e.time}</div>
                  <div style={{ fontSize: '10px', fontWeight: 500, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksView({ family, tasks, toggleTask, isAdmin, setModal }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '28px', fontWeight: 600 }}>Tareas de hoy</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'task', data: null })}><Plus size={16} /> Nueva tarea</button>}
      </div>
      {tasks.length === 0 && <div style={{ color: '#8A7560', padding: '12px 0' }}>Sin tareas para hoy.</div>}
      {tasks.map(t => (
        <div key={`${t.id}-${t._displayWho}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid #F5EFE6', opacity: t.done ? 0.5 : 1 }}>
          <div onClick={(e) => toggleTask(t.id, t._displayWho, e)} className={`checkbox ${t.done ? 'done' : ''}`} style={{ cursor: 'pointer' }}>{t.done && <Check size={16} color="#FDFAF3" strokeWidth={3} />}</div>
          <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={(e) => toggleTask(t.id, t._displayWho, e)}>
            <div style={{ fontSize: '14px', fontWeight: 500, textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.text}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              {t.time && <div style={{ fontSize: '11px', color: '#8A7560' }}>⏰ {t.time}</div>}
              <div className="recurrence-badge"><Repeat size={10} />{recurrenceLabel(t.recurrence)}</div>
              {isSharedItem(t) && <div className="shared-badge"><Users size={9} /> Compartida</div>}
            </div>
          </div>
          <div className="avatar" style={{ background: family[t._displayWho]?.color || '#999' }}>
            {family[t._displayWho]?.role === 'pet' ? family[t._displayWho].emoji : family[t._displayWho]?.initial}
          </div>
          {isAdmin && <button onClick={() => setModal({ type: 'task', data: t })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#8A7560' }}><Edit2 size={16} /></button>}
        </div>
      ))}
    </div>
  );
}

function RoutinesView({ family, normalKidKeys, youngKidKeys, kidKeys, routines, todaysRoutinesFor, toggleRoutine, points, isAdmin, setModal, viewFilter }) {
  const ranking = kidKeys.map(k => ({ k, ...family[k], pts: points[k] || 0 })).sort((a,b) => b.pts - a.pts);
  const visibleNormal = viewFilter === 'all' ? normalKidKeys : (normalKidKeys.includes(viewFilter) ? [viewFilter] : []);
  const visibleYoung = viewFilter === 'all' ? youngKidKeys : (youngKidKeys.includes(viewFilter) ? [viewFilter] : []);

  // Filtro por momento del día. Default: el momento actual.
  const [timeFilter, setTimeFilter] = useState(() => getCurrentTimeOfDay());

  const filterByTime = (items) => {
    if (timeFilter === 'all') return items;
    return items.filter(item => {
      const t = getRoutineTimeOfDay(item);
      return t === timeFilter || t === 'any';
    });
  };

  const TimeFilterBar = () => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#8A7560', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Momento:</span>
      <button className={`time-pill ${timeFilter === 'morning' ? 'selected' : ''}`} onClick={() => setTimeFilter('morning')}>
        <Sunrise size={14} /> Mañana
      </button>
      <button className={`time-pill ${timeFilter === 'afternoon' ? 'selected' : ''}`} onClick={() => setTimeFilter('afternoon')}>
        <Sun size={14} /> Tarde
      </button>
      <button className={`time-pill ${timeFilter === 'evening' ? 'selected' : ''}`} onClick={() => setTimeFilter('evening')}>
        <Moon size={14} /> Noche
      </button>
      <button className={`time-pill ${timeFilter === 'all' ? 'selected' : ''}`} onClick={() => setTimeFilter('all')}>
        Todo el día
      </button>
    </div>
  );

  return (
    <div>
      {kidKeys.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #FFF8EE 0%, #FFE8D6 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Trophy size={24} color="#F5B645" />
            <div className="serif" style={{ fontSize: '24px', fontWeight: 600 }}>Ranking del mes</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(ranking.length, 3)}, 1fr)`, gap: '8px', alignItems: 'end' }}>
            {ranking.slice(0, 3).map((r, idx) => {
              const heights = [120, 90, 70];
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={r.k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>{medals[idx]}</div>
                  <div className="avatar" style={{ background: r.color, width: '48px', height: '48px', fontSize: '20px', margin: '0 auto 6px' }}>{r.initial}</div>
                  <div className="serif" style={{ fontSize: '16px', fontWeight: 700 }}>{r.name}</div>
                  <div className="serif" style={{ fontSize: '28px', fontWeight: 700, color: r.color }}>{r.pts}</div>
                  <div style={{ fontSize: '10px', color: '#8A7560', marginBottom: '6px' }}>puntos</div>
                  <div style={{ background: r.color, height: `${heights[idx]}px`, borderRadius: '10px 10px 0 0', opacity: 0.85 }}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="serif" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Rutinas de hoy</div>
      <TimeFilterBar />

      {visibleNormal.length === 0 && visibleYoung.length === 0 && <div style={{ color: '#8A7560' }}>Seleccioná un menor en el filtro de arriba.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {visibleNormal.map(kid => {
          const m = family[kid];
          const allR = todaysRoutinesFor(kid);
          const r = filterByTime(allR);
          const done = r.filter(i => i.done).length;
          return (
            <div key={kid} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="avatar" style={{ background: m.color, width: '40px', height: '40px', fontSize: '16px' }}>{m.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: '#8A7560' }}>{done} de {r.length}{timeFilter !== 'all' && allR.length !== r.length ? ` (${allR.length} total)` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif" style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{points[kid] || 0}</div>
                  <div style={{ fontSize: '10px', color: '#8A7560' }}>puntos</div>
                </div>
              </div>
              <div style={{ height: '6px', background: '#F5EFE6', borderRadius: '3px', marginBottom: '14px', overflow: 'hidden' }}>
                <div style={{ width: r.length ? `${(done / r.length) * 100}%` : '0%', height: '100%', background: m.color, transition: 'width 0.4s ease' }}/>
              </div>
              {r.length === 0 && (
                <div style={{ fontSize: '12px', color: '#8A7560', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
                  {timeFilter === 'all' ? 'Sin rutinas hoy' : `Sin rutinas para ${getTimeOfDayInfo(timeFilter).label.toLowerCase()}`}
                </div>
              )}
              {r.map(item => {
                const tod = getRoutineTimeOfDay(item);
                const todInfo = getTimeOfDayInfo(tod);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '5px', borderRadius: '10px', background: item.done ? '#FBF5E9' : 'transparent' }}>
                    <div onClick={(e) => toggleRoutine(kid, item.id, e)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer', minWidth: 0 }}>
                      <div style={{ fontSize: '22px' }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.text}</div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <div className="points-badge">{item.points || 1} pt{(item.points || 1) > 1 ? 's' : ''}</div>
                          {tod !== 'any' && <div className="recurrence-badge">{todInfo.emoji} {todInfo.label}</div>}
                          {isSharedItem(item) && <div className="shared-badge"><Users size={9} /> Compartida</div>}
                        </div>
                      </div>
                      <div className={`checkbox ${item.done ? 'done' : ''}`} style={{ width: '22px', height: '22px' }}>{item.done && <Check size={13} color="#FDFAF3" strokeWidth={3} />}</div>
                    </div>
                    {isAdmin && <button onClick={() => setModal({ type: 'routine', member: kid, data: item })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A7560' }}><Edit2 size={14} /></button>}
                  </div>
                );
              })}
              {isAdmin && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button onClick={() => setModal({ type: 'routineTemplates', member: kid })} style={{ flex: 1, padding: '10px', background: '#FBF5E9', border: '1.5px solid #E8DEC9', borderRadius: '12px', color: '#3D2E1F', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Wand2 size={14} /> Plantilla
                  </button>
                  <button onClick={() => setModal({ type: 'routine', member: kid, data: null })} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1.5px dashed #D4C5B0', borderRadius: '12px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {visibleYoung.map(kid => {
          const m = family[kid];
          const allR = todaysRoutinesFor(kid);
          const r = filterByTime(allR);
          return (
            <div key={kid} className="card" style={{ background: '#FFF8EE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="avatar" style={{ background: m.color, width: '40px', height: '40px', fontSize: '16px' }}>{m.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: '#8A7560' }}>{r.filter(i => i.done).length} de {r.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif" style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{points[kid] || 0}</div>
                  <div style={{ fontSize: '10px', color: '#8A7560' }}>puntos</div>
                </div>
              </div>
              {r.length === 0 && (
                <div style={{ fontSize: '12px', color: '#8A7560', textAlign: 'center', padding: '12px', fontStyle: 'italic' }}>
                  {timeFilter === 'all' ? 'Sin rutinas hoy' : `Sin rutinas para ${getTimeOfDayInfo(timeFilter).label.toLowerCase()}`}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {r.map(item => (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <div onClick={(e) => toggleRoutine(kid, item.id, e)} style={{ aspectRatio: '1', background: item.done ? m.color : 'white', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${item.done ? m.color : '#F5EFE6'}`, padding: '6px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '6px' }}>{item.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: item.done ? 'white' : '#3D2E1F', textAlign: 'center' }}>{item.label || item.text}</div>
                      <div style={{ fontSize: '9px', color: item.done ? 'rgba(255,255,255,0.8)' : '#A67C12', marginTop: '2px' }}>{item.points || 1} pt</div>
                      {item.done && <Check size={16} color="white" strokeWidth={3} style={{ marginTop: '3px' }} />}
                    </div>
                    {isAdmin && <button onClick={() => setModal({ type: 'routine', member: kid, data: item })} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7560' }}><Edit2 size={11} /></button>}
                  </div>
                ))}
                {isAdmin && (
                  <button onClick={() => setModal({ type: 'routineTemplates', member: kid })} style={{ aspectRatio: '1', background: '#FBF5E9', border: '2px solid #E8DEC9', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#3D2E1F', fontFamily: 'inherit' }}>
                    <Wand2 size={26} />
                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>Plantilla</div>
                  </button>
                )}
                {isAdmin && <button onClick={() => setModal({ type: 'routine', member: kid, data: null })} style={{ aspectRatio: '1', background: 'transparent', border: '2px dashed #D4C5B0', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8A7560', fontFamily: 'inherit' }}><Plus size={26} /><div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px' }}>Agregar</div></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobsView({ family, kidKeys, bigJobs, todaysJobs, submitJob, validateJob, rejectJob, money, points, isAdmin, setModal }) {
  const pending = todaysJobs.filter(j => j.status === 'pending');
  const review = todaysJobs.filter(j => j.status === 'review');
  return (
    <div>
      {kidKeys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {kidKeys.map(k => {
            const m = family[k];
            return (
              <div key={k} className="card" style={{ background: `linear-gradient(135deg, ${m.color}15 0%, ${m.color}30 100%)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div className="avatar" style={{ background: m.color, width: '40px', height: '40px', fontSize: '16px' }}>{m.initial}</div>
                  <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>{m.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '10px', color: '#8A7560', fontWeight: 600 }}><Star size={11} style={{ display: 'inline' }}/> PUNTOS</div><div className="serif" style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{points[k] || 0}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#8A7560', fontWeight: 600 }}><DollarSign size={11} style={{ display: 'inline' }}/> DINERO</div><div className="serif" style={{ fontSize: '22px', fontWeight: 700 }}>{formatMoney(money[k] || 0)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '28px', fontWeight: 600 }}>Trabajos de hoy</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'job', data: null })}><Plus size={16} /> Nuevo trabajo</button>}
      </div>

      {review.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #FFF4E0 0%, #FFE9C7 100%)', border: '2px solid #F5B645' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <Clock size={20} color="#E8804F" />
            <div className="serif" style={{ fontSize: '18px', fontWeight: 600 }}>Esperando validación</div>
            <Lock size={14} color="#8A7560" style={{ marginLeft: 'auto' }} />
            <span style={{ fontSize: '11px', color: '#8A7560' }}>Requiere PIN</span>
          </div>
          {review.map(j => (
            <div key={j.id} style={{ background: 'white', borderRadius: '12px', padding: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '28px' }}>{j.icon}</div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{j.title}</div>
                <div style={{ fontSize: '11px', color: '#8A7560' }}>{family[j.who]?.name} marcó como hecho</div>
              </div>
              <div className="serif" style={{ fontSize: '16px', fontWeight: 700, color: j.reward.type === 'money' ? '#7BA05B' : '#F5B645' }}>
                {j.reward.type === 'money' ? formatMoney(j.reward.value) : `${j.reward.value} pts`}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-ghost" onClick={() => rejectJob(j.id)}>Rechazar</button>
                <button className="btn-success" onClick={(e) => validateJob(j.id, e)}><Check size={14} /> Aprobar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Asignados ({pending.length})</div>
        {pending.length === 0 && <div style={{ color: '#8A7560', padding: '12px 0' }}>No hay trabajos pendientes hoy.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {pending.map(j => {
            const m = family[j.who];
            if (!m) return null;
            return (
              <div key={j.id} style={{ background: '#FBF5E9', borderRadius: '14px', padding: '14px', borderLeft: `4px solid ${m.color}`, position: 'relative' }}>
                {isAdmin && <button onClick={() => setModal({ type: 'job', data: j })} style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#8A7560' }}><Edit2 size={13} /></button>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '28px' }}>{j.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{j.title}</div>
                    <div style={{ fontSize: '11px', color: '#8A7560' }}>{m.name} · {j.deadline}</div>
                  </div>
                </div>
                {j.notes && <div style={{ fontSize: '12px', color: '#8A7560', fontStyle: 'italic', marginBottom: '10px', padding: '6px 8px', background: 'white', borderRadius: '6px' }}>"{j.notes}"</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: j.reward.type === 'money' ? '#5C7D42' : '#A67C12' }}>
                    {j.reward.type === 'money' ? formatMoney(j.reward.value) : `${j.reward.value} pts`}
                  </div>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={(e) => submitJob(j.id, e)}>Marcar hecho</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ListsView({ lists, toggleListItem, deleteListItem, clearCompletedItems, isAdmin, setModal }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '28px', fontWeight: 600 }}>Listas compartidas</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'list', data: null })}><Plus size={16} /> Nueva lista</button>}
      </div>
      {lists.length === 0 && <div style={{ color: '#8A7560', padding: '40px 0', textAlign: 'center' }}>No hay listas todavía. {isAdmin && 'Creá la primera con "+ Nueva lista".'}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {lists.map(l => {
          const done = l.items.filter(i => i.done).length;
          const allDone = l.items.length > 0 && done === l.items.length;
          return (
            <div key={l.id} className="card" style={allDone ? { opacity: 0.7, background: '#FBF5E9' } : {}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px' }}>{l.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: '18px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                  <div style={{ fontSize: '11px', color: allDone ? '#7BA05B' : '#8A7560', fontWeight: allDone ? 600 : 400 }}>{allDone ? '✓ Completa' : `${done} de ${l.items.length}`}</div>
                </div>
                {isAdmin && <button onClick={() => setModal({ type: 'list', data: l })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A7560' }}><Edit2 size={15} /></button>}
              </div>
              <div>
                {l.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0' }}>
                    <div onClick={(e) => toggleListItem(l.id, item.id, e)} className={`checkbox ${item.done ? 'done' : ''}`} style={{ width: '20px', height: '20px', cursor: 'pointer' }}>{item.done && <Check size={13} color="#FDFAF3" strokeWidth={3} />}</div>
                    <div style={{ flex: 1, fontSize: '13px', textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.5 : 1, cursor: 'pointer', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={(e) => toggleListItem(l.id, item.id, e)}>{item.text}</div>
                    <button onClick={() => deleteListItem(l.id, item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#C0392B', opacity: 0.4 }}><X size={13} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                {isAdmin && <button onClick={() => setModal({ type: 'listItem', listId: l.id, data: null })} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1.5px dashed #D4C5B0', borderRadius: '10px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Plus size={13} /> Item</button>}
                {done > 0 && <button onClick={() => clearCompletedItems(l.id)} style={{ padding: '8px 10px', background: '#F5EFE6', border: 'none', borderRadius: '10px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><RotateCcw size={11} /> Limpiar</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryView({ family, kidKeys, history, tasks, bigJobs, routines, viewFilter }) {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = viewFilter === 'all' ? sorted : sorted.filter(h => h.who === viewFilter);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthHist = history.filter(h => h.date.startsWith(currentMonth));
  const stats = kidKeys.map(k => {
    const kidHist = monthHist.filter(h => h.who === k);
    return { k, ...family[k], routinesDone: kidHist.filter(h => h.kind === 'routine').length, jobsDone: kidHist.filter(h => h.kind === 'job').length, moneyEarned: kidHist.reduce((s, h) => s + (h.money || 0), 0), pointsEarned: kidHist.reduce((s, h) => s + (h.points || 0), 0) };
  });
  const findRoutineTitle = (h) => {
    const direct = (routines[h.who] || []).find(rt => rt.id === h.templateId);
    if (direct) return direct.text || direct.label || '?';
    const shared = (routines.shared || []).find(rt => rt.id === h.templateId);
    if (shared) return shared.text || shared.label || '?';
    return '?';
  };
  const getTitle = (h) => {
    if (h.title) return h.title;
    if (h.kind === 'task') return tasks.find(t => t.id === h.templateId)?.text || '?';
    if (h.kind === 'job') return bigJobs.find(j => j.id === h.templateId)?.title || '?';
    if (h.kind === 'routine') return findRoutineTitle(h);
    return '?';
  };
  const kindLabel = { task: 'Tarea', routine: 'Rutina', job: 'Trabajo' };
  const kindColor = { task: '#5B96B0', routine: '#F5B645', job: '#7BA05B' };
  return (
    <div>
      <div className="serif" style={{ fontSize: '28px', fontWeight: 600, marginBottom: '16px' }}>Historial del mes</div>
      {kidKeys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {stats.map(s => (
            <div key={s.k} className="card" style={{ background: `linear-gradient(135deg, ${s.color}10 0%, ${s.color}25 100%)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div className="avatar" style={{ background: s.color, width: '36px', height: '36px', fontSize: '14px' }}>{s.initial}</div>
                <div className="serif" style={{ fontSize: '18px', fontWeight: 600 }}>{s.name}</div>
              </div>
              <div style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Rutinas</span><span style={{ fontWeight: 700 }}>{s.routinesDone}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Trabajos</span><span style={{ fontWeight: 700 }}>{s.jobsDone}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Dinero</span><span style={{ fontWeight: 700, color: '#7BA05B' }}>${s.moneyEarned.toLocaleString('es-AR')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Puntos</span><span style={{ fontWeight: 700, color: s.color }}>{s.pointsEarned}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <div className="serif" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '14px' }}>Actividad reciente</div>
        {filtered.length === 0 && <div style={{ color: '#8A7560' }}>Aún no hay actividad registrada.</div>}
        {filtered.slice(0, 30).map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F5EFE6' }}>
            <div className="avatar" style={{ background: family[h.who]?.color || '#999', width: '30px', height: '30px', fontSize: '12px' }}>
              {family[h.who]?.role === 'pet' ? family[h.who].emoji : family[h.who]?.initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTitle(h)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                <div className="pill" style={{ background: kindColor[h.kind] + '20', color: kindColor[h.kind], fontWeight: 600 }}>{kindLabel[h.kind]}</div>
                <span style={{ fontSize: '11px', color: '#8A7560' }}>{h.date}</span>
              </div>
            </div>
            {h.points && <div style={{ fontSize: '12px', fontWeight: 700, color: '#F5B645' }}>+{h.points} pts</div>}
            {h.money && <div style={{ fontSize: '12px', fontWeight: 700, color: '#7BA05B' }}>+${h.money.toLocaleString('es-AR')}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
// ============================================================================
// MENU DE COMIDAS
// ============================================================================

function MealsView({ meals, setMealForDate, showBalance, toggleBalance, familySize, isAdmin }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pickerState, setPickerState] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = `${MONTHS[month]} ${year}`;

  // Generar las 6 semanas del mes (42 celdas)
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // lunes = 0
    const cells = [];
    const start = new Date(year, month, 1 - startDow);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(0, 0, 0, 0);
      cells.push(d);
    }
    return cells;
  }, [year, month]);

  const tk = todayKey();

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); };

  const openPicker = (dateKey, slot, meal) => setPickerState({ dateKey, slot, meal });
  const closePicker = () => setPickerState(null);

  const onPickMeal = (meal) => {
    if (!pickerState) return;
    setMealForDate(pickerState.dateKey, pickerState.slot, meal);
    closePicker();
  };
  const onClearMeal = () => {
    if (!pickerState) return;
    setMealForDate(pickerState.dateKey, pickerState.slot, null);
    closePicker();
  };

  // Para el balance: contamos todos los platos cargados en el MES VISIBLE (lunch + dinner)
  // Los normalizamos a "veces por semana" dividiendo por 4.3 (semanas por mes promedio)
  const balanceData = useMemo(() => {
    const counts = {};
    MEAL_BALANCE_CATEGORIES.forEach(c => { counts[c.id] = 0; });
    cells.forEach(d => {
      if (d.getMonth() !== month) return; // sólo del mes actual
      const k = dateKey(d);
      const day = meals[k];
      if (!day) return;
      [day.lunch, day.dinner].forEach(meal => {
        if (!meal) return;
        // El meal puede tener id (catálogo) o ser custom (sólo name)
        if (meal.id) {
          const fullMeal = getMealById(meal.id);
          if (fullMeal) {
            mealBalanceCategories(fullMeal).forEach(catId => { counts[catId] = (counts[catId] || 0) + 1; });
          }
        }
      });
    });
    // Normalizar: todos los conteos los pasamos a "veces por semana"
    const weeksInMonth = 4.3;
    const perWeek = {};
    Object.keys(counts).forEach(k => { perWeek[k] = counts[k] / weeksInMonth; });
    return { counts, perWeek };
  }, [cells, meals, month]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '28px', fontWeight: 600 }}>Menú de comidas</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button className="btn-ghost" onClick={toggleBalance} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PieChart size={14} /> {showBalance ? 'Ocultar balance' : 'Mostrar balance'}
            </button>
          )}
        </div>
      </div>

      {/* Navegación de mes */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={goPrev} className="btn-ghost" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></button>
            <div className="serif" style={{ fontSize: '22px', fontWeight: 600, minWidth: '180px', textAlign: 'center', textTransform: 'capitalize' }}>{monthLabel}</div>
            <button onClick={goNext} className="btn-ghost" style={{ padding: '8px 10px' }}><ChevronRight size={16} /></button>
          </div>
          <button onClick={goToday} className="btn-ghost">Hoy</button>
        </div>

        {/* Cabecera de días */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} style={{ fontSize: '11px', color: '#8A7560', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grilla del mes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells.map((d, idx) => {
            const inMonth = d.getMonth() === month;
            const k = dateKey(d);
            const isToday = k === tk;
            const day = meals[k] || {};
            return (
              <div key={idx} className={`meal-day-cell ${isToday ? 'today' : ''} ${!inMonth ? 'other-month' : ''}`}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: isToday ? '#3D2E1F' : '#8A7560', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{d.getDate()}</span>
                </div>
                <MealSlot
                  label="A"
                  meal={day.lunch}
                  onClick={() => isAdmin && openPicker(k, 'lunch', day.lunch)}
                  disabled={!isAdmin}
                />
                <MealSlot
                  label="C"
                  meal={day.dinner}
                  onClick={() => isAdmin && openPicker(k, 'dinner', day.dinner)}
                  disabled={!isAdmin}
                />
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: '11px', color: '#8A7560', marginTop: '12px', textAlign: 'center' }}>
          A = Almuerzo · C = Cena · {familySize} {familySize === 1 ? 'persona' : 'personas'}
        </div>
      </div>

      {/* Balance */}
      {showBalance && <BalanceCard balanceData={balanceData} />}

      {pickerState && (
        <MealPickerModal
          dateKey={pickerState.dateKey}
          slot={pickerState.slot}
          currentMeal={pickerState.meal}
          onSelect={onPickMeal}
          onClear={onClearMeal}
          onClose={closePicker}
        />
      )}
    </div>
  );
}

function MealSlot({ label, meal, onClick, disabled }) {
  if (!meal) {
    return (
      <div className="meal-slot empty" onClick={disabled ? undefined : onClick} style={disabled ? { cursor: 'default' } : {}}>
        <span style={{ fontSize: '9px', fontWeight: 700, opacity: 0.5 }}>{label}</span>
        {!disabled && <Plus size={10} />}
      </div>
    );
  }
  const fullMeal = meal.id ? getMealById(meal.id) : null;
  const emoji = fullMeal?.emoji || '🍽️';
  const name = fullMeal?.name || meal.name || 'Sin nombre';
  return (
    <div className="meal-slot" onClick={disabled ? undefined : onClick} style={disabled ? { cursor: 'default' } : {}} title={`${label === 'A' ? 'Almuerzo' : 'Cena'}: ${name}`}>
      <span style={{ fontSize: '9px', fontWeight: 700, color: '#8A7560' }}>{label}</span>
      <span style={{ fontSize: '12px' }}>{emoji}</span>
      <span style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  );
}

// Donut anidada: anillo externo = sugerido, anillo interno = real
function BalanceCard({ balanceData }) {
  const { perWeek } = balanceData;
  // Excluimos 'fried' del cálculo principal (es un límite, no objetivo). Lo mostramos aparte.
  const objectives = MEAL_BALANCE_CATEGORIES.filter(c => !c.isLimit);
  const limits = MEAL_BALANCE_CATEGORIES.filter(c => c.isLimit);

  // Calcular porcentajes para cada anillo
  const totalSuggested = objectives.reduce((s, c) => s + c.suggested, 0);
  const totalActual = objectives.reduce((s, c) => s + (perWeek[c.id] || 0), 0);

  // Ring config
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 110;
  const outerStroke = 22;
  const innerR = 78;
  const innerStroke = 22;

  const polar = (radius, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (radius, startAngle, endAngle) => {
    const start = polar(radius, endAngle);
    const end = polar(radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  // Outer ring (sugerido)
  let outerCursor = 0;
  const outerSegments = objectives.map(cat => {
    const portion = (cat.suggested / totalSuggested) * 360;
    const seg = { id: cat.id, startAngle: outerCursor, endAngle: outerCursor + portion, color: cat.color, label: cat.label, value: cat.suggested };
    outerCursor += portion;
    return seg;
  });

  // Inner ring (real)
  let innerCursor = 0;
  const innerSegments = totalActual > 0 ? objectives.map(cat => {
    const v = perWeek[cat.id] || 0;
    const portion = (v / totalActual) * 360;
    const seg = { id: cat.id, startAngle: innerCursor, endAngle: innerCursor + portion, color: cat.color, label: cat.label, value: v };
    innerCursor += portion;
    return seg;
  }) : [];

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <PieChart size={20} color="#3D2E1F" />
        <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>Balance del mes</div>
      </div>
      <p style={{ fontSize: '12px', color: '#8A7560', marginBottom: '20px', lineHeight: 1.5 }}>
        Anillo exterior: distribución <strong>sugerida</strong> para una alimentación variada · Anillo interior: <strong>tu menú actual</strong> normalizado por semana
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%', height: 'auto' }}>
            {/* Outer ring background */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#F5EFE6" strokeWidth={outerStroke} />
            {/* Outer ring (sugerido) */}
            {outerSegments.map(seg => (
              <path key={`o-${seg.id}`} d={arcPath(outerR, seg.startAngle, seg.endAngle)} fill="none" stroke={seg.color} strokeWidth={outerStroke} strokeLinecap="butt" opacity={0.55} />
            ))}
            {/* Inner ring background */}
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#F5EFE6" strokeWidth={innerStroke} />
            {/* Inner ring (real) */}
            {innerSegments.map(seg => (
              <path key={`i-${seg.id}`} d={arcPath(innerR, seg.startAngle, seg.endAngle)} fill="none" stroke={seg.color} strokeWidth={innerStroke} strokeLinecap="butt" />
            ))}
            {/* Center text */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="700" fontSize="22" fill="#3D2E1F">{totalActual.toFixed(1)}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="11" fill="#8A7560">cargas/sem</text>
            {totalActual === 0 && (
              <text x={cx} y={cy + 36} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#8A7560" fontStyle="italic">Cargá platos para ver</text>
            )}
          </svg>
        </div>

        {/* Leyenda con barras de comparación */}
        <div style={{ minWidth: '220px', flex: 1 }}>
          {objectives.map(cat => {
            const actual = perWeek[cat.id] || 0;
            const suggested = cat.suggested;
            const ratio = suggested > 0 ? Math.min(actual / suggested, 1.5) : 0;
            const status = actual === 0 ? 'empty' : actual < suggested * 0.7 ? 'low' : actual > suggested * 1.4 ? 'high' : 'ok';
            return (
              <div key={cat.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#8A7560' }}>
                    <strong style={{ color: '#3D2E1F' }}>{actual.toFixed(1)}</strong> / {suggested}<span style={{ fontSize: '10px' }}>×sem</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: '#F5EFE6', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${(actual / Math.max(suggested * 1.5, 0.1)) * 100}%`, maxWidth: '100%', height: '100%', background: cat.color, transition: 'width 0.4s ease', opacity: status === 'empty' ? 0.3 : 1 }}/>
                  {/* Marcador del objetivo */}
                  <div style={{ position: 'absolute', left: `${(suggested / Math.max(suggested * 1.5, 0.1)) * 100}%`, top: '-2px', bottom: '-2px', width: '2px', background: '#3D2E1F', opacity: 0.4 }}/>
                </div>
              </div>
            );
          })}

          {/* Límites (frituras) */}
          {limits.map(cat => {
            const actual = perWeek[cat.id] || 0;
            const limit = cat.suggested;
            const overLimit = actual > limit;
            return (
              <div key={cat.id} style={{ marginTop: '14px', padding: '10px 12px', background: overLimit ? '#FCEBE6' : '#FBF5E9', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ fontSize: '10px', color: '#8A7560', fontStyle: 'italic' }}>(máx sugerido {limit}/sem)</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: overLimit ? '#C0392B' : '#3D2E1F' }}>{actual.toFixed(1)}×sem</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MealPickerModal({ dateKey: dKey, slot, currentMeal, onSelect, onClear, onClose }) {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [tab, setTab] = useState('catalog');

  const slotLabel = slot === 'lunch' ? 'Almuerzo' : 'Cena';
  const dateObj = parseKey(dKey);
  const dateLabel = `${DAYS_FULL[dateObj.getDay()]} ${dateObj.getDate()} de ${MONTHS[dateObj.getMonth()]}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MEAL_CATALOG;
    return MEAL_CATALOG.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [search]);

  // Agrupar por categoría
  const byCategory = useMemo(() => {
    const groups = {};
    filtered.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [filtered]);

  const handlePickFromCatalog = (meal) => {
    onSelect({ id: meal.id });
  };
  const handleSaveCustom = () => {
    if (!customName.trim()) return;
    onSelect({ name: customName.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <div className="serif" style={{ fontSize: '22px', fontWeight: 600 }}>{slotLabel}</div>
            <div style={{ fontSize: '12px', color: '#8A7560', textTransform: 'capitalize' }}>{dateLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: '#FBF5E9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} /></button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className={`tab-pill ${tab === 'catalog' ? 'selected' : ''}`} onClick={() => setTab('catalog')}>Sugerencias</div>
          <div className={`tab-pill ${tab === 'custom' ? 'selected' : ''}`} onClick={() => setTab('custom')}>Escribir a mano</div>
        </div>

        {tab === 'catalog' && (
          <div>
            <input className="input" placeholder="Buscar plato..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus style={{ marginBottom: '14px' }} />
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {Object.keys(byCategory).length === 0 && <div style={{ color: '#8A7560', textAlign: 'center', padding: '30px 0' }}>No se encontraron platos.</div>}
              {Object.keys(byCategory).map(cat => (
                <div key={cat} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#8A7560', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
                    {byCategory[cat].map(m => {
                      const isCurrent = currentMeal?.id === m.id;
                      return (
                        <button key={m.id} onClick={() => handlePickFromCatalog(m)} style={{ background: isCurrent ? '#3D2E1F' : 'white', color: isCurrent ? 'white' : '#3D2E1F', border: `1.5px solid ${isCurrent ? '#3D2E1F' : '#E8DEC9'}`, borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
                          <span style={{ fontSize: '18px' }}>{m.emoji}</span>
                          <span style={{ flex: 1, lineHeight: 1.2 }}>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'custom' && (
          <div>
            <p style={{ fontSize: '13px', color: '#8A7560', marginBottom: '14px' }}>Si tu plato no está en el catálogo, escribilo a mano. No se incluirá en el balance.</p>
            <div className="field"><div className="label">Nombre del plato</div>
              <input className="input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej: Pollo con curry y arroz" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveCustom()} maxLength={60} />
            </div>
            <button className="btn-primary" onClick={handleSaveCustom} disabled={!customName.trim()} style={{ width: '100%', justifyContent: 'center' }}>Guardar plato</button>
          </div>
        )}

        {currentMeal && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn-danger" onClick={onClear}>
              <Trash2 size={14} /> Quitar este plato
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODALES
// ============================================================================

function PinPrompt({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    if (pin.length === 4) {
      if (verifyAdminPin(pin)) onSuccess();
      else { setError(true); setPin(''); setTimeout(() => setError(false), 600); }
    }
  }, [pin]);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#3D2E1F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Lock size={28} color="#FDFAF3" /></div>
        <div className="serif" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>PIN de admin</div>
        <div style={{ fontSize: '14px', color: '#8A7560', marginBottom: '24px' }}>Ingresá el PIN para continuar</div>
        <div style={{ marginBottom: '20px' }}>
          <input type="password" inputMode="numeric" maxLength={4} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className="pin-input" style={{ borderColor: error ? '#C0392B' : '#E8DEC9' }} />
        </div>
        {error && <div style={{ color: '#C0392B', fontSize: '13px', marginBottom: '12px' }}>PIN incorrecto</div>}
        <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function SettingsModal({ config, familyCode, onUpdate, onClose, onResetFamily }) {
  const [tab, setTab] = useState('share');
  const [editConfig, setEditConfig] = useState({
    adults: [], kids: [], helpers: [], pets: [], bonusPct: 10,
    ...JSON.parse(JSON.stringify(config))
  });
  const [pinChange, setPinChange] = useState({ current: '', newPin: '', confirm: '', message: null });
  const [copied, setCopied] = useState(false);

  const usedColors = getUsedColors(editConfig);

  const updateAdult = (i, field, value) => setEditConfig({ ...editConfig, adults: editConfig.adults.map((a, idx) => idx === i ? { ...a, [field]: value } : a) });
  const updateKid = (i, field, value) => setEditConfig({ ...editConfig, kids: editConfig.kids.map((k, idx) => idx === i ? { ...k, [field]: value } : k) });
  const updateHelper = (i, field, value) => setEditConfig({ ...editConfig, helpers: (editConfig.helpers || []).map((h, idx) => idx === i ? { ...h, [field]: value } : h) });
  const updatePet = (i, field, value) => setEditConfig({ ...editConfig, pets: (editConfig.pets || []).map((p, idx) => idx === i ? { ...p, [field]: value } : p) });

  const removeAdult = (i) => { if ((editConfig.adults || []).length <= 1) { alert('Tiene que haber al menos un adulto.'); return; } setEditConfig({ ...editConfig, adults: editConfig.adults.filter((_, idx) => idx !== i) }); };
  const removeKid = (i) => { if ((editConfig.kids || []).length <= 1) { alert('Tiene que haber al menos un hijo.'); return; } setEditConfig({ ...editConfig, kids: editConfig.kids.filter((_, idx) => idx !== i) }); };
  const removeHelper = (i) => setEditConfig({ ...editConfig, helpers: (editConfig.helpers || []).filter((_, idx) => idx !== i) });
  const removePet = (i) => setEditConfig({ ...editConfig, pets: (editConfig.pets || []).filter((_, idx) => idx !== i) });

  const addAdult = () => { if ((editConfig.adults || []).length >= 2) return; const colors = Object.values(PALETTE).filter(p => !usedColors.includes(p.color)); const id = generateMemberId('adult', editConfig); setEditConfig({ ...editConfig, adults: [...(editConfig.adults || []), { id, name: '', color: colors[0]?.color || '#7BA05B' }] }); };
  const addKid = () => { if ((editConfig.kids || []).length >= 6) return; const colors = Object.values(PALETTE).filter(p => !usedColors.includes(p.color)); const id = generateMemberId('kid', editConfig); setEditConfig({ ...editConfig, kids: [...(editConfig.kids || []), { id, name: '', color: colors[0]?.color || '#E87A93', young: false }] }); };
  const addHelper = () => { if ((editConfig.helpers || []).length >= 4) return; const colors = Object.values(PALETTE).filter(p => !usedColors.includes(p.color)); const id = generateMemberId('helper', editConfig); setEditConfig({ ...editConfig, helpers: [...(editConfig.helpers || []), { id, name: '', color: colors[0]?.color || '#5B96B0' }] }); };
  const addPet = () => { if ((editConfig.pets || []).length >= 5) return; const colors = Object.values(PALETTE).filter(p => !usedColors.includes(p.color)); const id = generateMemberId('pet', editConfig); setEditConfig({ ...editConfig, pets: [...(editConfig.pets || []), { id, name: '', petType: 'dog', color: colors[0]?.color || '#9B7FB8' }] }); };

  const setBonus = (v) => setEditConfig({ ...editConfig, bonusPct: v });

  const canSave = (editConfig.adults || []).every(a => a.name.trim()) && (editConfig.kids || []).every(k => k.name.trim()) && (editConfig.helpers || []).every(h => h.name.trim()) && (editConfig.pets || []).every(p => p.name.trim());
  const handleSave = () => { if (!canSave) { alert('Completá todos los nombres.'); return; } onUpdate(editConfig); onClose(); };

  const handlePinChange = () => {
    if (!verifyAdminPin(pinChange.current)) { setPinChange({ ...pinChange, message: { type: 'error', text: 'PIN actual incorrecto' } }); return; }
    if (!/^\d{4}$/.test(pinChange.newPin)) { setPinChange({ ...pinChange, message: { type: 'error', text: 'El PIN nuevo debe ser de 4 dígitos' } }); return; }
    if (pinChange.newPin !== pinChange.confirm) { setPinChange({ ...pinChange, message: { type: 'error', text: 'Los PINs no coinciden' } }); return; }
    updateAdminPin(pinChange.newPin);
    setStoredFamilyPin(familyCode, pinChange.newPin);
    setPinChange({ current: '', newPin: '', confirm: '', message: { type: 'success', text: 'PIN actualizado' } });
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(familyCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="serif" style={{ fontSize: '24px', fontWeight: 600 }}>Ajustes</div>
          <button onClick={onClose} style={{ background: '#FBF5E9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} /></button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className={`tab-pill ${tab === 'share' ? 'selected' : ''}`} onClick={() => setTab('share')}>Compartir</div>
          <div className={`tab-pill ${tab === 'family' ? 'selected' : ''}`} onClick={() => setTab('family')}>Miembros</div>
          <div className={`tab-pill ${tab === 'pets' ? 'selected' : ''}`} onClick={() => setTab('pets')}>Mascotas</div>
          <div className={`tab-pill ${tab === 'bonus' ? 'selected' : ''}`} onClick={() => setTab('bonus')}>Bonus</div>
          <div className={`tab-pill ${tab === 'pin' ? 'selected' : ''}`} onClick={() => setTab('pin')}>PIN</div>
          <div className={`tab-pill ${tab === 'danger' ? 'selected' : ''}`} onClick={() => setTab('danger')} style={{ marginLeft: 'auto' }}>Avanzado</div>
        </div>

        {tab === 'share' && (
          <div>
            <div className="editor-section" style={{ background: 'linear-gradient(135deg, #FFF8EE 0%, #FFE8D6 100%)', textAlign: 'center', padding: '24px' }}>
              <Share2 size={28} color="#3D2E1F" style={{ margin: '0 auto 10px' }} />
              <div className="serif" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Tu código de familia</div>
              <p style={{ fontSize: '12px', color: '#8A7560', marginBottom: '14px' }}>Compartilo para que otros dispositivos vean los mismos datos.</p>
              <div style={{ background: '#3D2E1F', color: '#FDFAF3', padding: '14px', borderRadius: '12px', marginBottom: '12px' }}>
                <div className="serif" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.05em' }}>{familyCode}</div>
              </div>
              <button className="btn-primary" onClick={copyCode} style={{ width: '100%', justifyContent: 'center' }}>
                <Copy size={14} /> {copied ? '¡Copiado!' : 'Copiar código'}
              </button>
              <p style={{ fontSize: '11px', color: '#8A7560', fontStyle: 'italic', marginTop: '12px', lineHeight: 1.5 }}>
                Cualquiera con este código puede ver y editar los datos. No lo compartas con desconocidos.
              </p>
            </div>
          </div>
        )}

        {tab === 'family' && (
          <div>
            <div className="editor-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Users size={16} /><div style={{ fontSize: '14px', fontWeight: 700 }}>Adultos ({(editConfig.adults || []).length}/2)</div></div>
              {(editConfig.adults || []).map((a, i) => (<EditorPersonRow key={a.id} person={a} usedColors={usedColors} onUpdate={(f, v) => updateAdult(i, f, v)} onRemove={() => removeAdult(i)} canRemove={(editConfig.adults || []).length > 1} />))}
              {(editConfig.adults || []).length < 2 && <AddBtn onClick={addAdult} label="Agregar adulto" />}
            </div>
            <div className="editor-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Baby size={16} /><div style={{ fontSize: '14px', fontWeight: 700 }}>Hijos ({(editConfig.kids || []).length}/6)</div></div>
              {(editConfig.kids || []).map((k, i) => (<EditorPersonRow key={k.id} person={k} usedColors={usedColors} onUpdate={(f, v) => updateKid(i, f, v)} onRemove={() => removeKid(i)} canRemove={(editConfig.kids || []).length > 1} showYoung />))}
              {(editConfig.kids || []).length < 6 && <AddBtn onClick={addKid} label="Agregar hijo" />}
            </div>
            <div className="editor-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><HeartHandshake size={16} /><div style={{ fontSize: '14px', fontWeight: 700 }}>Ayuda ({(editConfig.helpers || []).length}/4)</div></div>
              {(editConfig.helpers || []).map((h, i) => (<EditorPersonRow key={h.id} person={h} usedColors={usedColors} onUpdate={(f, v) => updateHelper(i, f, v)} onRemove={() => removeHelper(i)} canRemove={true} />))}
              {(editConfig.helpers || []).length < 4 && <AddBtn onClick={addHelper} label="Agregar ayuda" />}
            </div>
            <div style={{ background: '#FFF4E0', padding: '12px 14px', borderRadius: '10px', fontSize: '12px', color: '#6B4F18', marginTop: '12px' }}>⚠️ Si eliminás un miembro, se borran sus rutinas, tareas y trabajos.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={!canSave}>Guardar</button>
            </div>
          </div>
        )}

        {tab === 'pets' && (
          <div>
            <div className="editor-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><PawPrint size={16} /><div style={{ fontSize: '14px', fontWeight: 700 }}>Mascotas ({(editConfig.pets || []).length}/5)</div></div>
              <p style={{ fontSize: '12px', color: '#8A7560', marginBottom: '14px', lineHeight: 1.5 }}>Las mascotas pueden tener tareas asignadas (pasearlas, darles de comer) pero no son perfiles activos.</p>
              {(editConfig.pets || []).map((p, i) => (<EditorPetRow key={p.id} pet={p} usedColors={usedColors} onUpdate={(f, v) => updatePet(i, f, v)} onRemove={() => removePet(i)} />))}
              {(editConfig.pets || []).length < 5 && <AddBtn onClick={addPet} label="Agregar mascota" />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={!canSave}>Guardar</button>
            </div>
          </div>
        )}

        {tab === 'bonus' && (
          <div>
            <div className="editor-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><Award size={16} /><div style={{ fontSize: '14px', fontWeight: 700 }}>Bonus por completar el día</div></div>
              <BonusPicker value={editConfig.bonusPct ?? DEFAULT_BONUS_PCT} onChange={setBonus} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        )}

        {tab === 'pin' && (
          <div>
            <div className="editor-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><Lock size={16} /><div style={{ fontSize: '14px', fontWeight: 700 }}>Cambiar PIN</div></div>
              <div className="field"><div className="label">PIN actual</div><input className="input" type="password" inputMode="numeric" maxLength={4} value={pinChange.current} onChange={(e) => setPinChange({ ...pinChange, current: e.target.value.replace(/\D/g, '').slice(0, 4), message: null })} placeholder="••••" /></div>
              <div className="field"><div className="label">PIN nuevo</div><input className="input" type="password" inputMode="numeric" maxLength={4} value={pinChange.newPin} onChange={(e) => setPinChange({ ...pinChange, newPin: e.target.value.replace(/\D/g, '').slice(0, 4), message: null })} placeholder="••••" /></div>
              <div className="field"><div className="label">Repetir</div><input className="input" type="password" inputMode="numeric" maxLength={4} value={pinChange.confirm} onChange={(e) => setPinChange({ ...pinChange, confirm: e.target.value.replace(/\D/g, '').slice(0, 4), message: null })} placeholder="••••" /></div>
              {pinChange.message && (<div style={{ padding: '10px 12px', borderRadius: '10px', fontSize: '13px', marginBottom: '12px', background: pinChange.message.type === 'success' ? '#EDF4E2' : '#FCEBE6', color: pinChange.message.type === 'success' ? '#3D5C26' : '#C0392B' }}>{pinChange.message.text}</div>)}
              <button className="btn-primary" onClick={handlePinChange}>Cambiar PIN</button>
            </div>
          </div>
        )}

        {tab === 'danger' && (
          <div>
            <div style={{ background: '#FCEBE6', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 600, color: '#C0392B', marginBottom: '6px' }}>Salir de esta familia</div>
              <p style={{ fontSize: '13px', color: '#8A7560', marginBottom: '12px' }}>Te desconecta de la familia actual en este dispositivo. Los datos en la nube se conservan, podés volver con el código.</p>
              <button className="btn-danger" onClick={onResetFamily}><Trash2 size={14} /> Salir de la familia</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditorPersonRow({ person, usedColors, onUpdate, onRemove, canRemove, showYoung = false }) {
  return (
    <div className="editor-row">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
        <input className="input" placeholder="Nombre" value={person.name} onChange={(e) => onUpdate('name', e.target.value)} maxLength={20} style={{ background: 'white' }} />
        {canRemove && <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#C0392B', padding: '6px' }}><Trash2 size={16} /></button>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: showYoung ? '10px' : 0 }}>
        {Object.values(PALETTE).map(p => {
          const isUsed = usedColors.includes(p.color) && person.color !== p.color;
          return (<button key={p.color} type="button" disabled={isUsed} onClick={() => onUpdate('color', p.color)} className={`ob-color-btn ${person.color === p.color ? 'selected' : ''}`} style={{ background: p.color, width: '28px', height: '28px' }} title={p.name} />);
        })}
      </div>
      {showYoung && (<div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}><button type="button" className={`ob-toggle ${!person.young ? 'selected' : ''}`} onClick={() => onUpdate('young', false)}>Vista normal</button><button type="button" className={`ob-toggle ${person.young ? 'selected' : ''}`} onClick={() => onUpdate('young', true)}>Vista simple</button></div>)}
    </div>
  );
}

function EditorPetRow({ pet, usedColors, onUpdate, onRemove }) {
  return (
    <div className="editor-row">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '24px' }}>{getPetEmoji(pet.petType)}</span>
        <input className="input" placeholder="Nombre" value={pet.name} onChange={(e) => onUpdate('name', e.target.value)} maxLength={20} style={{ background: 'white' }} />
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#C0392B', padding: '6px' }}><Trash2 size={16} /></button>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: '#8A7560', marginBottom: '6px', fontWeight: 600 }}>TIPO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {PET_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => onUpdate('petType', t.id)} className={`pet-type-btn ${pet.petType === t.id ? 'selected' : ''}`}>
              <span style={{ fontSize: '14px' }}>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#8A7560', marginBottom: '6px', fontWeight: 600 }}>COLOR</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {Object.values(PALETTE).map(p => {
            const isUsed = usedColors.includes(p.color) && pet.color !== p.color;
            return (<button key={p.color} type="button" disabled={isUsed} onClick={() => onUpdate('color', p.color)} className={`ob-color-btn ${pet.color === p.color ? 'selected' : ''}`} style={{ background: p.color, width: '28px', height: '28px' }} title={p.name} />);
          })}
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, onSave, onDelete, hasId, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="serif" style={{ fontSize: '22px', fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: '#FBF5E9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '10px', flexWrap: 'wrap' }}>
          {hasId && onDelete ? <button className="btn-danger" onClick={onDelete}><Trash2 size={14} /> Eliminar</button> : <div />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={onSave}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonPicker({ family, value, onChange, label = 'Asignar a' }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {Object.entries(family).map(([k, m]) => (
          <div key={k} className={`person-chip ${value === k ? 'selected' : ''}`} style={{ '--clr': m.color }} onClick={() => onChange(k)}>
            {m.role === 'pet' ? (
              <div className="avatar" style={{ background: m.color, width: '22px', height: '22px', fontSize: '13px' }}>{m.emoji}</div>
            ) : (
              <div className="avatar" style={{ background: m.color, width: '22px', height: '22px', fontSize: '11px' }}>{m.initial}</div>
            )}
            {m.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiPersonPicker({ family, allowedKeys, values, onChange, label = 'Asignar a', emptyMessage = '' }) {
  const toggle = (k) => {
    if (values.includes(k)) onChange(values.filter(v => v !== k));
    else onChange([...values, k]);
  };
  return (
    <div className="field">
      <div className="label">{label}</div>
      <p style={{ fontSize: '11px', color: '#8A7560', marginBottom: '8px', fontStyle: 'italic' }}>Si elegís a más de uno, queda compartida: cada uno la marca en lo suyo.</p>
      {emptyMessage && allowedKeys.length === 0 && <p style={{ fontSize: '12px', color: '#C0392B' }}>{emptyMessage}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {allowedKeys.map(k => {
          const m = family[k];
          if (!m) return null;
          const selected = values.includes(k);
          return (
            <div key={k} className={`person-chip ${selected ? 'selected' : ''}`} style={{ '--clr': m.color }} onClick={() => toggle(k)}>
              {m.role === 'pet' ? (
                <div className="avatar" style={{ background: m.color, width: '22px', height: '22px', fontSize: '13px' }}>{m.emoji}</div>
              ) : (
                <div className="avatar" style={{ background: m.color, width: '22px', height: '22px', fontSize: '11px' }}>{m.initial}</div>
              )}
              {m.name}
              {selected && <Check size={13} color={m.color} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconPicker({ icons, value, onChange }) {
  return (
    <div className="field"><div className="label">Ícono</div><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{icons.map(ic => (<button key={ic} type="button" className={`icon-picker-btn ${value === ic ? 'selected' : ''}`} onClick={() => onChange(ic)}>{ic}</button>))}</div></div>
  );
}

function PointsPicker({ value, onChange }) {
  return (
    <div className="field"><div className="label">Puntaje al completar</div><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{[1,2,3,4,5,6,7,8,9,10].map(n => (<button key={n} type="button" onClick={() => onChange(n)} className={`points-picker-btn ${value === n ? 'selected' : ''}`}>{n}</button>))}</div><div style={{ fontSize: '11px', color: '#8A7560', marginTop: '6px', fontStyle: 'italic' }}>Más puntos para tareas más importantes.</div></div>
  );
}

function TimeOfDayPicker({ value, onChange, label = 'Momento del día' }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button type="button" className={`time-pill ${value === 'morning' ? 'selected' : ''}`} onClick={() => onChange('morning')}><Sunrise size={14} /> Mañana</button>
        <button type="button" className={`time-pill ${value === 'afternoon' ? 'selected' : ''}`} onClick={() => onChange('afternoon')}><Sun size={14} /> Tarde</button>
        <button type="button" className={`time-pill ${value === 'evening' ? 'selected' : ''}`} onClick={() => onChange('evening')}><Moon size={14} /> Noche</button>
        <button type="button" className={`time-pill ${value === 'any' ? 'selected' : ''}`} onClick={() => onChange('any')}>Cualquier momento</button>
      </div>
    </div>
  );
}

function RecurrencePicker({ recurrence, onChange }) {
  const [type, setType] = useState(recurrence?.type || 'daily');
  const [weekdays, setWeekdays] = useState(recurrence?.weekdays || [1,2,3,4,5]);
  const [dayOfMonth, setDayOfMonth] = useState(recurrence?.dayOfMonth || 1);
  const [interval, setIntervalDays] = useState(recurrence?.interval || 2);
  const [startDate, setStartDate] = useState(recurrence?.startDate || todayKey());
  useEffect(() => { const r = { type, startDate }; if (type === 'weekly') r.weekdays = weekdays; if (type === 'monthly') r.dayOfMonth = dayOfMonth; if (type === 'custom') r.interval = interval; onChange(r); }, [type, weekdays, dayOfMonth, interval, startDate]);
  const toggleWeekday = (d) => setWeekdays(weekdays.includes(d) ? weekdays.filter(x => x !== d) : [...weekdays, d].sort());
  const getNextOccurrences = () => {
    const tempItem = { recurrence: { type, startDate, weekdays, dayOfMonth, interval } };
    const occurrences = []; const start = parseKey(startDate);
    const cursor = new Date(); cursor.setHours(0,0,0,0);
    const from = cursor < start ? start : cursor;
    let check = new Date(from); let safety = 0;
    while (occurrences.length < 3 && safety < 365) { if (appliesOn(tempItem, check)) { occurrences.push(new Date(check)); if (type === 'once') break; } check.setDate(check.getDate() + 1); safety++; }
    return occurrences;
  };
  const formatPreview = (d) => { const today = new Date(); today.setHours(0,0,0,0); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); if (dateKey(d) === dateKey(today)) return 'Hoy'; if (dateKey(d) === dateKey(tomorrow)) return 'Mañana'; return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };
  const occurrences = getNextOccurrences();
  return (
    <div className="field">
      <div className="label">Periodicidad</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {[{ id: 'once', label: 'Única' },{ id: 'daily', label: 'Diaria' },{ id: 'weekly', label: 'Semanal' },{ id: 'monthly', label: 'Mensual' },{ id: 'custom', label: 'Cada X días' }].map(opt => (<div key={opt.id} className={`toggle-pill ${type === opt.id ? 'selected' : ''}`} onClick={() => setType(opt.id)} style={{ fontSize: '12px', padding: '8px 8px' }}>{opt.label}</div>))}
      </div>
      {type === 'weekly' && (<div style={{ marginBottom: '14px' }}><div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>Días</div><div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>{[1,2,3,4,5,6,0].map(d => (<div key={d} className={`day-pill ${weekdays.includes(d) ? 'selected' : ''}`} onClick={() => toggleWeekday(d)}>{DAYS_ES[d]}</div>))}</div></div>)}
      {type === 'monthly' && (<div style={{ marginBottom: '14px' }}><div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>Día del mes</div><input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="input" style={{ width: '120px' }} /></div>)}
      {type === 'custom' && (<div style={{ marginBottom: '14px' }}><div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>Cada cuántos días</div><input type="number" min="2" max="90" value={interval} onChange={(e) => setIntervalDays(Number(e.target.value))} className="input" style={{ width: '120px' }} /></div>)}
      <div style={{ marginTop: '12px', padding: '12px', background: '#FBF5E9', borderRadius: '12px' }}><div className="label" style={{ marginBottom: '6px' }}>{type === 'once' ? 'Fecha' : 'Empieza el'}</div><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ background: 'white' }} /></div>
      {occurrences.length > 0 && (<div style={{ marginTop: '10px', padding: '10px 12px', background: '#3D2E1F', borderRadius: '12px', color: '#FDFAF3' }}><div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, marginBottom: '6px' }}>{type === 'once' ? 'APARECERÁ' : 'PRÓXIMAS'}</div><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{occurrences.map((d, i) => (<div key={i} className="serif" style={{ fontSize: '13px', fontWeight: 600, padding: '5px 10px', background: 'rgba(253,250,243,0.12)', borderRadius: '999px' }}>{formatPreview(d)}</div>))}</div></div>)}
    </div>
  );
}

function TaskModal({ data, family, onSave, onDelete, onClose }) {
  const allKeys = Object.keys(family);
  const initialWhoIds = Array.isArray(data?.whoIds) ? data.whoIds : (data?.who ? [data.who] : (allKeys[0] ? [allKeys[0]] : []));
  const [text, setText] = useState(data?.text || '');
  const [whoIds, setWhoIds] = useState(initialWhoIds);
  const [time, setTime] = useState(data?.time || '');
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'daily', startDate: todayKey() });

  const handleSave = () => {
    if (!text.trim()) return;
    if (whoIds.length === 0) { alert('Asigná la tarea a al menos un miembro.'); return; }
    onSave({ id: data?.id, text, whoIds, time: time || null, recurrence });
  };
  return (
    <ModalShell title={data ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Tarea</div><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: Comprar verduras" autoFocus /></div>
      <MultiPersonPicker family={family} allowedKeys={allKeys} values={whoIds} onChange={setWhoIds} label="Asignar a" />
      <div className="field"><div className="label">Hora (opcional)</div><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function JobModal({ data, family, kidKeys, onSave, onDelete, onClose }) {
  const kids = {}; kidKeys.forEach(k => { kids[k] = family[k]; });
  const [title, setTitle] = useState(data?.title || '');
  const [icon, setIcon] = useState(data?.icon || '🌱');
  const [who, setWho] = useState(data?.who || kidKeys[0]);
  const [rewardType, setRewardType] = useState(data?.reward?.type || 'points');
  const [rewardValue, setRewardValue] = useState(data?.reward?.value || 5);
  const [deadline, setDeadline] = useState(data?.deadline || 'Hoy');
  const [notes, setNotes] = useState(data?.notes || '');
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'once', startDate: todayKey() });
  const handleSave = () => { if (title.trim()) onSave({ id: data?.id, title, icon, who, reward: { type: rewardType, value: Number(rewardValue) }, deadline, notes, recurrence }); };
  return (
    <ModalShell title={data ? 'Editar trabajo' : 'Nuevo trabajo'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Trabajo</div><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Cortar el pasto" autoFocus /></div>
      <IconPicker icons={['🌱','🚗','👗','🧸','🪴','🐠','🧹','🪟','🛋️','🍽️','📚','🧺','🚿','🌻']} value={icon} onChange={setIcon} />
      <PersonPicker family={kids} value={who} onChange={setWho} />
      <div className="field"><div className="label">Recompensa</div><div style={{ display: 'flex', gap: '8px' }}><div className={`toggle-pill ${rewardType === 'points' ? 'selected' : ''}`} onClick={() => setRewardType('points')}><Star size={14}/> Puntos</div><div className={`toggle-pill ${rewardType === 'money' ? 'selected' : ''}`} onClick={() => setRewardType('money')}><DollarSign size={14}/> Dinero</div></div></div>
      <div className="field"><div className="label">{rewardType === 'money' ? 'Monto' : 'Puntos'}</div><input className="input" type="number" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} /></div>
      <div className="field"><div className="label">Para cuándo</div><input className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
      <div className="field"><div className="label">Notas</div><textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ resize: 'vertical' }} /></div>
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function EventModal({ data, family, onSave, onDelete, onClose }) {
  const firstKey = Object.keys(family)[0];
  const [title, setTitle] = useState(data?.title || '');
  const [time, setTime] = useState(data?.time || '12:00');
  const [duration, setDuration] = useState(data?.duration || '1h');
  const [who, setWho] = useState(data?.who || firstKey);
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'once', startDate: todayKey() });
  const handleSave = () => { if (title.trim()) onSave({ id: data?.id, title, time, duration, who, recurrence }); };
  return (
    <ModalShell title={data ? 'Editar evento' : 'Nuevo evento'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Título</div><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="field"><div className="label">Hora</div><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        <div className="field"><div className="label">Duración</div><input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1h, 30m" /></div>
      </div>
      <PersonPicker family={family} value={who} onChange={setWho} label="Quién" />
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function RoutineModal({ data, member, memberData, family, kidKeys, onSave, onDelete, onClose }) {
  const isYoung = memberData?.young;
  const initialWhoIds = Array.isArray(data?.whoIds) ? data.whoIds : (data?.who ? [data.who] : (member ? [member] : []));
  const [text, setText] = useState(data?.text || data?.label || '');
  const [icon, setIcon] = useState(data?.icon || (isYoung ? '👕' : '🛏️'));
  const [points, setPoints] = useState(data?.points || 1);
  const [whoIds, setWhoIds] = useState(initialWhoIds);
  const [timeOfDay, setTimeOfDay] = useState(data?.timeOfDay || 'any');
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'daily', startDate: todayKey() });

  const handleSave = () => {
    if (!text.trim()) return;
    if (whoIds.length === 0) { alert('Asigná la rutina a al menos un hijo.'); return; }
    const base = isYoung ? { label: text } : { text };
    const payload = {
      id: data?.id,
      ...base,
      icon,
      points,
      timeOfDay,
      recurrence,
      whoIds,
    };
    onSave(payload);
  };

  return (
    <ModalShell title={`${data ? 'Editar' : 'Nuevo'} paso · rutinas`} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">{isYoung ? 'Etiqueta' : 'Paso'}</div><input className="input" value={text} onChange={(e) => setText(e.target.value)} autoFocus /></div>
      <IconPicker icons={['👕','🥣','🪥','💆','🧴','🧥','🛏️','🥐','🎒','🎸','👟','📚','🚿','🧦','🍎','🎨','📝','🚽','🧼','🪑','🍽️','🍴','📖','⏰','✏️','📓','🧺','📵','💧','⚽','😴','📅','🌻','🍳','🗑️','💬']} value={icon} onChange={setIcon} />
      <PointsPicker value={points} onChange={setPoints} />
      <TimeOfDayPicker value={timeOfDay} onChange={setTimeOfDay} />
      <MultiPersonPicker family={family} allowedKeys={kidKeys} values={whoIds} onChange={setWhoIds} label="Asignar a (hijos)" />
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function RoutineTemplatesModal({ member, memberData, family, kidKeys, onApply, onClose, onCreateBlank }) {
  const isYoung = memberData?.young;
  const groupKey = isYoung ? 'young' : 'kid';
  const [tab, setTab] = useState(groupKey);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [targetIds, setTargetIds] = useState([member]);

  const groups = [
    { id: 'young',   label: 'Vista simple', subtitle: '≤5 años' },
    { id: 'kid',     label: 'Niños',        subtitle: '6-10 años' },
    { id: 'preteen', label: 'Pre-adolescentes', subtitle: '11+ años' },
  ];

  const apply = () => {
    if (!selectedTemplate) return;
    if (targetIds.length === 0) { alert('Elegí a quién aplicar la plantilla.'); return; }
    onApply(selectedTemplate, targetIds);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="serif" style={{ fontSize: '22px', fontWeight: 600 }}>Plantillas de rutina</div>
          <button onClick={onClose} style={{ background: '#FBF5E9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} /></button>
        </div>
        <p style={{ fontSize: '13px', color: '#8A7560', marginBottom: '18px' }}>Elegí una plantilla por edad. Después podés editar o borrar pasos.</p>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {groups.map(g => (
            <div key={g.id} className={`tab-pill ${tab === g.id ? 'selected' : ''}`} onClick={() => { setTab(g.id); setSelectedTemplate(null); }}>
              {g.label} <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}>{g.subtitle}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {(ROUTINE_TEMPLATES[tab] || []).map(tpl => {
            const tod = getTimeOfDayInfo(tpl.timeOfDay);
            return (
              <button key={tpl.id} className={`template-card ${selectedTemplate?.id === tpl.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(tpl)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '24px' }}>{tpl.icon}</div>
                  <div className="serif" style={{ fontSize: '15px', fontWeight: 700 }}>{tpl.name}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>{tpl.description}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#A67C12', fontWeight: 600 }}>{tpl.steps.length} pasos</span>
                  {tpl.timeOfDay && tpl.timeOfDay !== 'any' && <span className="recurrence-badge">{tod.emoji} {tod.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {selectedTemplate && (
          <div className="editor-section" style={{ background: '#FBF5E9', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: '#8A7560', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Vista previa de pasos</div>
            {selectedTemplate.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                <div style={{ fontSize: '20px' }}>{step.icon}</div>
                <div style={{ flex: 1, fontSize: '13px' }}>{step.text || step.label}</div>
                <div className="points-badge">{step.points || 1} pt</div>
              </div>
            ))}
            <div style={{ marginTop: '14px' }}>
              <MultiPersonPicker family={family} allowedKeys={kidKeys} values={targetIds} onChange={setTargetIds} label="Aplicar a" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={onCreateBlank}>Crear desde cero</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={apply} disabled={!selectedTemplate}>Aplicar plantilla</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListModal({ data, onSave, onDelete, onClose }) {
  const [name, setName] = useState(data?.name || '');
  const [icon, setIcon] = useState(data?.icon || '📝');
  const handleSave = () => { if (name.trim()) onSave({ id: data?.id, name, icon }); };
  return (
    <ModalShell title={data ? 'Editar lista' : 'Nueva lista'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Nombre</div><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
      <IconPicker icons={['🛒','🏖️','🎂','📝','🧳','🎁','🍳','🏠','💊','📚','🎉','✈️','🏥']} value={icon} onChange={setIcon} />
    </ModalShell>
  );
}

function ListItemModal({ data, onSave, onClose }) {
  const [text, setText] = useState(data?.text || '');
  const handleSave = () => { if (text.trim()) onSave({ id: data?.id, text }); };
  return (
    <ModalShell title="Agregar item" onClose={onClose} onSave={handleSave} hasId={!!data}>
      <div className="field"><div className="label">Item</div><input className="input" value={text} onChange={(e) => setText(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} /></div>
    </ModalShell>
  );
}