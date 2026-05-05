import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, ListTodo, Sparkles, Home, Plus, Check, Trophy, Briefcase, Clock, DollarSign, Star, X, Trash2, Edit2, UserCircle, Repeat, History as HistoryIcon, Lock, Eye, MessageSquare, RotateCcw } from 'lucide-react';
import {
  DAYS_ES, DAYS_FULL, MONTHS, MONTHS_SHORT,
  dateKey, parseKey, daysBetween, appliesOn, recurrenceLabel, todayKey,
  loadState, saveState, verifyAdminPin, updateAdminPin,
  FAMILY, INITIAL_TASKS, INITIAL_VERO_TASKS, INITIAL_ROUTINES, INITIAL_JOBS, INITIAL_EVENTS, INITIAL_LISTS,
  getLocation, fetchWeather, weatherCodeToInfo,
  formatMoney, formatTime, formatDate,
} from './lib.js';

export default function App() {
  const [activeUser, setActiveUser] = useState(() => loadState('activeUser', 'sebas'));
  const [tasks, setTasks] = useState(() => loadState('tasks', [...INITIAL_TASKS, ...INITIAL_VERO_TASKS]));
  const [routines, setRoutines] = useState(() => loadState('routines', INITIAL_ROUTINES));
  const [bigJobs, setBigJobs] = useState(() => loadState('bigJobs', INITIAL_JOBS));
  const [events, setEvents] = useState(() => loadState('events', INITIAL_EVENTS));
  const [lists, setLists] = useState(() => loadState('lists', INITIAL_LISTS));
  const [points, setPoints] = useState(() => loadState('points', { juani: 0, delfi: 0, fran: 0 }));
  const [money, setMoney] = useState(() => loadState('money', { juani: 0, delfi: 0, fran: 0 }));
  const [history, setHistory] = useState(() => loadState('history', []));
  const [jobInstances, setJobInstances] = useState(() => loadState('jobInstances', []));

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

  useEffect(() => saveState('activeUser', activeUser), [activeUser]);
  useEffect(() => saveState('tasks', tasks), [tasks]);
  useEffect(() => saveState('routines', routines), [routines]);
  useEffect(() => saveState('bigJobs', bigJobs), [bigJobs]);
  useEffect(() => saveState('events', events), [events]);
  useEffect(() => saveState('lists', lists), [lists]);
  useEffect(() => saveState('points', points), [points]);
  useEffect(() => saveState('money', money), [money]);
  useEffect(() => saveState('history', history), [history]);
  useEffect(() => saveState('jobInstances', jobInstances), [jobInstances]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getLocation().then(loc => {
      setLocation(loc);
      fetchWeather(loc.lat, loc.lon).then(setWeather);
    });
  }, []);

  const family = FAMILY;
  const isAdmin = family[activeUser]?.isAdmin;
  const tk = todayKey();

  const today = new Date(); today.setHours(0,0,0,0);

  const todaysTasks = tasks.filter(t => appliesOn(t, today)).map(t => ({
    ...t, done: history.some(h => h.kind === 'task' && h.templateId === t.id && h.date === tk),
  }));

  const todaysEvents = events.filter(e => appliesOn(e, today));

  const todaysRoutinesFor = (kid) => (routines[kid] || []).filter(r => appliesOn(r, today)).map(r => ({
    ...r, done: history.some(h => h.kind === 'routine' && h.templateId === r.id && h.date === tk && h.who === kid),
  }));

  const todaysJobs = bigJobs.filter(j => {
    const hasInstance = jobInstances.some(i => i.jobId === j.id && i.date === tk);
    return hasInstance || appliesOn(j, today);
  }).map(j => {
    const inst = jobInstances.find(i => i.jobId === j.id && i.date === tk);
    return { ...j, instance: inst, status: inst?.status || 'pending' };
  });

  const filterByView = (items, getWho) => {
    if (viewFilter === 'all') return items;
    return items.filter(i => getWho(i) === viewFilter);
  };

  const triggerConfetti = (x, y, color, intensity = 1) => {
    const particles = [];
    const colors = [color, '#F5B645', '#E87A93', '#F09872', '#7BA05B', '#E8804F', '#5B96B0'];
    for (let i = 0; i < Math.floor(20 * intensity); i++) {
      particles.push({
        id: Math.random() + i, x, y,
        tx: (Math.random() - 0.5) * 350 * intensity,
        ty: -Math.random() * 280 - 80,
        rot: Math.random() * 720 - 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        shape: Math.random() > 0.5 ? '50%' : '2px',
      });
    }
    setConfetti(prev => [...prev, ...particles]);
    setTimeout(() => setConfetti(prev => prev.filter(p => !particles.find(np => np.id === p.id))), 1400);
  };

  const triggerPointsAnimation = (x, y, who, value = 1, type = 'point') => {
    const id = Math.random();
    setPointsAnimation(prev => [...prev, { id, x, y, color: family[who].color, value, type }]);
    setTimeout(() => setPointsAnimation(prev => prev.filter(p => p.id !== id)), 1600);
  };

  const triggerBigCelebration = (kidName, color, message) => {
    setBigCelebration({ name: kidName, color, message });
    setTimeout(() => setBigCelebration(null), 2800);
  };

  const toggleTask = (taskId, e) => {
    const task = tasks.find(t => t.id === taskId);
    const existing = history.find(h => h.kind === 'task' && h.templateId === taskId && h.date === tk);
    if (existing) {
      setHistory(history.filter(h => h.id !== existing.id));
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[task.who].color);
      setHistory([...history, { id: Date.now(), kind: 'task', templateId: taskId, date: tk, who: task.who }]);
    }
  };

  const toggleRoutine = (kid, itemId, e) => {
    const existing = history.find(h => h.kind === 'routine' && h.templateId === itemId && h.date === tk && h.who === kid);
    if (existing) {
      setHistory(history.filter(h => h.id !== existing.id));
      setPoints(p => ({ ...p, [kid]: Math.max(0, p[kid] - 1) }));
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const todays = todaysRoutinesFor(kid);
      const willAllBeDone = todays.every(r => r.id === itemId || r.done);
      triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[kid].color);
      triggerPointsAnimation(rect.left + rect.width/2, rect.top + rect.height/2, kid, 1, 'point');
      setHistory([...history, { id: Date.now(), kind: 'routine', templateId: itemId, date: tk, who: kid, points: 1 }]);
      setPoints(p => ({ ...p, [kid]: p[kid] + 1 }));
      if (willAllBeDone) {
        setPoints(p => ({ ...p, [kid]: p[kid] + 5 }));
        triggerBigCelebration(family[kid].name, family[kid].color, '¡Rutina completa! +5 bonus');
      }
    }
  };

  const toggleListItem = (listId, itemId, e) => {
    const list = lists.find(l => l.id === listId);
    const item = list.items.find(i => i.id === itemId);
    if (!item.done) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, '#E8804F', 0.6);
    }
    setLists(lists.map(l => l.id === listId ? {
      ...l, items: l.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    } : l));
  };

  const submitJob = (jobId, e) => {
    const job = bigJobs.find(j => j.id === jobId);
    const rect = e.currentTarget.getBoundingClientRect();
    triggerConfetti(rect.left + rect.width/2, rect.top + rect.height/2, family[job.who].color, 0.8);
    setJobInstances(prev => {
      const existing = prev.find(i => i.jobId === jobId && i.date === tk);
      if (existing) return prev.map(i => i.id === existing.id ? { ...i, status: 'review' } : i);
      return [...prev, { id: `j${jobId}-${tk}`, jobId, date: tk, status: 'review' }];
    });
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
    triggerBigCelebration(family[job.who].name, family[job.who].color,
      job.reward.type === 'money' ? `+${formatMoney(job.reward.value)}` : `+${job.reward.value} puntos`);
    if (job.reward.type === 'points') setPoints(p => ({ ...p, [job.who]: p[job.who] + job.reward.value }));
    else setMoney(m => ({ ...m, [job.who]: m[job.who] + job.reward.value }));
    setJobInstances(prev => prev.map(i => (i.jobId === jobId && i.date === tk) ? { ...i, status: 'done' } : i));
    setHistory(prev => [...prev, {
      id: Date.now(), kind: 'job', templateId: jobId, date: tk, who: job.who, title: job.title,
      ...(job.reward.type === 'points' ? { points: job.reward.value } : { money: job.reward.value })
    }]);
  };

  const rejectJob = (jobId) => {
    if (!isAdmin) {
      requestPin(() => {
        setJobInstances(prev => prev.map(i => (i.jobId === jobId && i.date === tk) ? { ...i, status: 'pending' } : i));
      });
      return;
    }
    setJobInstances(prev => prev.map(i => (i.jobId === jobId && i.date === tk) ? { ...i, status: 'pending' } : i));
  };

  const requestPin = (onSuccess) => setPinPrompt({ onSuccess });

  const tryAdminLogin = (userId) => {
    if (family[userId]?.isAdmin) {
      requestPin(() => setActiveUser(userId));
    } else {
      setActiveUser(userId);
    }
  };

  const saveTask = (data) => {
    if (data.id) setTasks(tasks.map(t => t.id === data.id ? { ...t, ...data } : t));
    else setTasks([...tasks, { ...data, id: Date.now() }]);
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

  const saveRoutineItem = (member, data) => {
    const current = routines[member] || [];
    if (data.id) setRoutines({ ...routines, [member]: current.map(r => r.id === data.id ? { ...r, ...data } : r) });
    else setRoutines({ ...routines, [member]: [...current, { ...data, id: Date.now() }] });
    setModal(null);
  };
  const deleteRoutineItem = (member, id) => {
    setRoutines({ ...routines, [member]: routines[member].filter(r => r.id !== id) });
    setModal(null);
  };

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
  const deleteListItem = (listId, itemId) => {
    setLists(lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l));
  };
  const clearCompletedItems = (listId) => {
    setLists(lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => !i.done) } : l));
  };

  const w = weather ? weatherCodeToInfo(weather.code) : null;

  return (
    <div style={{ fontFamily: '"DM Sans", -apple-system, sans-serif', background: '#FDFAF3', minHeight: '100vh', color: '#3D2E1F', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .serif { font-family: 'Fraunces', Georgia, serif; }
        .card { background: #FFFFFF; border-radius: 22px; padding: 24px; box-shadow: 0 1px 3px rgba(61,46,31,0.04), 0 2px 8px rgba(61,46,31,0.04); }
        .tab-btn { background: transparent; border: none; cursor: pointer; padding: 12px 14px; border-radius: 14px; color: #8A7560; font-family: inherit; font-size: 13px; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.2s ease; }
        .tab-btn.active { background: #3D2E1F; color: #FDFAF3; }
        .tab-btn:hover:not(.active) { background: rgba(61,46,31,0.06); color: #3D2E1F; }
        .checkbox { width: 26px; height: 26px; border-radius: 8px; border: 2px solid #D4C5B0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; flex-shrink: 0; }
        .checkbox.done { background: #3D2E1F; border-color: #3D2E1F; transform: scale(1.05); }
        .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; }
        .pill { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
        .btn-primary { background: #3D2E1F; color: #FDFAF3; border: none; border-radius: 12px; padding: 10px 16px; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-success { background: #7BA05B; color: white; border: none; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-ghost { background: transparent; color: #8A7560; border: 1px solid #D4C5B0; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; cursor: pointer; }
        .btn-danger { background: transparent; color: #C0392B; border: 1px solid #E8B5AD; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .input { width: 100%; padding: 12px 14px; border: 1.5px solid #E8DEC9; border-radius: 12px; font-family: inherit; font-size: 14px; background: #FBF5E9; color: #3D2E1F; outline: none; }
        .input:focus { border-color: #3D2E1F; background: white; }
        .label { display: block; font-size: 12px; font-weight: 600; color: #8A7560; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .field { margin-bottom: 18px; }
        .recurrence-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #8A7560; background: #F5EFE6; padding: 3px 8px; border-radius: 999px; font-weight: 500; }
        @keyframes confettiFly { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; } }
        @keyframes pointsRise { 0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; } 15% { transform: translate(-50%, -10px) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -90px) scale(1); opacity: 0; } }
        @keyframes bigPop { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0; } 15% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; } 25% { transform: translate(-50%,-50%) scale(1); opacity: 1; } 85% { transform: translate(-50%,-50%) scale(1); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(0.9); opacity: 0; } }
        @keyframes modalIn { 0% { opacity: 0; transform: scale(0.92) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes overlayIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .confetti-particle { position: fixed; pointer-events: none; z-index: 9999; animation: confettiFly 1.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .points-fly { position: fixed; pointer-events: none; z-index: 9999; font-family: 'Fraunces', serif; font-weight: 700; font-size: 24px; animation: pointsRise 1.6s ease-out forwards; }
        .big-celebration { position: fixed; top: 50%; left: 50%; z-index: 9998; animation: bigPop 2.8s ease-out forwards; pointer-events: none; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(61,46,31,0.45); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: overlayIn 0.2s ease-out; padding: 20px; }
        .modal-box { background: #FDFAF3; border-radius: 24px; max-width: 560px; width: 100%; max-height: 92vh; overflow-y: auto; padding: 32px; animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 30px 80px rgba(61,46,31,0.25); }
        .icon-picker-btn { width: 48px; height: 48px; border-radius: 12px; border: 2px solid #E8DEC9; background: white; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .icon-picker-btn.selected { border-color: #3D2E1F; background: #3D2E1F; transform: scale(1.05); }
        .person-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; cursor: pointer; border: 2px solid transparent; background: #FBF5E9; font-size: 13px; font-weight: 500; }
        .person-chip.selected { background: white; border-color: var(--clr); }
        .toggle-pill { padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 14px; border: 2px solid #E8DEC9; background: white; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .toggle-pill.selected { border-color: #3D2E1F; background: #3D2E1F; color: white; }
        .day-pill { width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 12px; border: 2px solid #E8DEC9; background: white; display: flex; align-items: center; justify-content: center; }
        .day-pill.selected { border-color: #3D2E1F; background: #3D2E1F; color: white; }
        .user-switcher { display: flex; align-items: center; gap: 6px; padding: 6px; background: white; border-radius: 999px; box-shadow: 0 1px 3px rgba(61,46,31,0.06); flex-wrap: wrap; }
        .user-switcher button { width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 13px; position: relative; }
        .user-switcher button.active { transform: scale(1.15); box-shadow: 0 0 0 2px white, 0 0 0 4px #3D2E1F; }
        .pin-input { width: 180px; height: 70px; border: 2px solid #E8DEC9; border-radius: 14px; text-align: center; font-size: 32px; font-weight: 700; font-family: 'Fraunces', serif; background: white; color: #3D2E1F; }
        .pin-input:focus { border-color: #3D2E1F; outline: none; }
        .app-container { max-width: 1600px; margin: 0 auto; }
        .header-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start;
        .header-row > .header-left { justify-self: start; }
        .header-row > .header-center { justify-self: center; padding-top: 12px; }
        .header-row > .header-right { justify-self: end; }
        @media (max-width: 900px) {
          .header-row { grid-template-columns: 1fr; gap: 12px; padding: 16px 20px; align-items: center; }
          .header-row > .header-left, .header-row > .header-center, .header-row > .header-right { justify-self: stretch; }
          .header-row > .header-center { order: -1; text-align: center; padding-bottom: 0; }
        }
      `}</style>

      {confetti.map(p => (
        <div key={p.id} className="confetti-particle" style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: p.color, borderRadius: p.shape, '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--rot': `${p.rot}deg` }}/>
      ))}
      {pointsAnimation.map(p => (
        <div key={p.id} className="points-fly" style={{ left: p.x, top: p.y, color: p.color }}>+{p.value} pt</div>
      ))}
      {bigCelebration && (
        <div className="big-celebration">
          <div style={{ background: 'white', borderRadius: '32px', padding: '40px 60px', boxShadow: `0 20px 60px ${bigCelebration.color}40`, textAlign: 'center', minWidth: '360px' }}>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>🎉</div>
            <div className="serif" style={{ fontSize: '36px', fontWeight: 700, color: bigCelebration.color, marginBottom: '6px' }}>¡Bien {bigCelebration.name}!</div>
            <div style={{ fontSize: '18px', color: '#8A7560', fontWeight: 500 }}>{bigCelebration.message}</div>
          </div>
        </div>
      )}

      <div className="app-container">

        <div className="header-row">
          <div className="header-left">
            <div className="serif" style={{ fontSize: '52px', fontWeight: 600, lineHeight: 1 }}>{formatTime(time)}</div>
            <div style={{ fontSize: '15px', color: '#8A7560', marginTop: '6px', textTransform: 'capitalize' }}>{formatDate(time)}</div>
          </div>

          <div className="header-center" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="serif" style={{ fontSize: '28px', fontWeight: 500, color: '#3D2E1F' }}>✦</span>
            <span className="serif" style={{ fontSize: '28px', fontWeight: 600, color: '#3D2E1F', letterSpacing: '0.02em' }}>Bendita Rutina</span>
          </div>

          <div className="header-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div className="user-switcher">
              {Object.entries(family).map(([k, m]) => (
                <button key={k} onClick={() => tryAdminLogin(k)} className={activeUser === k ? 'active' : ''} style={{ background: m.color }} title={m.name}>
                  {m.initial}
                  {m.isAdmin && <Lock size={10} style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'white', borderRadius: '50%', padding: '2px', color: '#3D2E1F' }} />}
                </button>
              ))}
            </div>
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

        <div style={{ padding: '0 40px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Eye size={14} color="#8A7560" />
          <span style={{ fontSize: '12px', color: '#8A7560', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Ver:</span>
          <button onClick={() => setViewFilter('all')} className="pill" style={{ background: viewFilter === 'all' ? '#3D2E1F' : 'white', color: viewFilter === 'all' ? '#FDFAF3' : '#3D2E1F', border: viewFilter === 'all' ? 'none' : '1px solid #D4C5B0', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 14px', fontWeight: 600 }}>Todo</button>
          {Object.entries(family).map(([k, m]) => (
            <button key={k} onClick={() => setViewFilter(k)} className="pill" style={{ background: viewFilter === k ? m.color : 'white', color: viewFilter === k ? 'white' : '#3D2E1F', border: viewFilter === k ? 'none' : '1px solid #D4C5B0', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 14px', fontWeight: 600 }}>{m.name}</button>
          ))}
        </div>

        <div style={{ padding: '0 40px 110px' }}>
          {activeTab === 'today'    && <TodayView family={family} events={filterByView(todaysEvents, e => e.who)} tasks={filterByView(todaysTasks, t => t.who)} points={points} toggleTask={toggleTask} />}
          {activeTab === 'calendar' && <CalendarView family={family} events={filterByView(events, e => e.who)} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'tasks'    && <TasksView family={family} todaysTasks={filterByView(todaysTasks, t => t.who)} toggleTask={toggleTask} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'routines' && <RoutinesView family={family} routines={routines} todaysRoutinesFor={todaysRoutinesFor} toggleRoutine={toggleRoutine} points={points} isAdmin={isAdmin} setModal={setModal} viewFilter={viewFilter} />}
          {activeTab === 'jobs'     && <JobsView family={family} bigJobs={bigJobs} todaysJobs={filterByView(todaysJobs, j => j.who)} submitJob={submitJob} validateJob={validateJob} rejectJob={rejectJob} money={money} points={points} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'lists'    && <ListsView lists={lists} toggleListItem={toggleListItem} deleteListItem={deleteListItem} clearCompletedItems={clearCompletedItems} isAdmin={isAdmin} setModal={setModal} />}
          {activeTab === 'history'  && <HistoryView family={family} history={history} tasks={tasks} bigJobs={bigJobs} routines={routines} viewFilter={viewFilter} />}
        </div>

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(253,250,243,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(61,46,31,0.08)', padding: '12px 16px', display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
        {[
          { id: 'today', label: 'Hoy', icon: Home },
          { id: 'calendar', label: 'Calendario', icon: Calendar },
          { id: 'tasks', label: 'Tareas', icon: CheckSquare },
          { id: 'routines', label: 'Rutinas', icon: Sparkles },
          { id: 'jobs', label: 'Trabajos', icon: Briefcase },
          { id: 'lists', label: 'Listas', icon: ListTodo },
          { id: 'history', label: 'Historial', icon: HistoryIcon },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {modal && modal.type === 'task' && <TaskModal data={modal.data} family={family} onSave={saveTask} onDelete={deleteTask} onClose={() => setModal(null)} />}
      {modal && modal.type === 'job' && <JobModal data={modal.data} family={family} onSave={saveJob} onDelete={deleteJob} onClose={() => setModal(null)} />}
      {modal && modal.type === 'event' && <EventModal data={modal.data} family={family} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)} />}
      {modal && modal.type === 'routine' && <RoutineModal data={modal.data} member={modal.member} memberData={family[modal.member]} onSave={(d) => saveRoutineItem(modal.member, d)} onDelete={(id) => deleteRoutineItem(modal.member, id)} onClose={() => setModal(null)} />}
      {modal && modal.type === 'list' && <ListModal data={modal.data} onSave={saveList} onDelete={deleteList} onClose={() => setModal(null)} />}
      {modal && modal.type === 'listItem' && <ListItemModal data={modal.data} listId={modal.listId} onSave={(d) => saveListItem(modal.listId, d)} onClose={() => setModal(null)} />}

      {pinPrompt && <PinPrompt onSuccess={() => { pinPrompt.onSuccess(); setPinPrompt(null); }} onCancel={() => setPinPrompt(null)} />}
    </div>
  );
}

function PinPrompt({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (verifyAdminPin(pin)) {
        onSuccess();
      } else {
        setError(true);
        setPin('');
        setTimeout(() => setError(false), 600);
      }
    }
  }, [pin]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#3D2E1F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={28} color="#FDFAF3" />
        </div>
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

function TodayView({ family, events, tasks, points, toggleTask }) {
  const pendingTasks = tasks.filter(t => !t.done).slice(0, 6);
  const ranking = ['juani','delfi','fran'].map(k => ({ k, ...family[k], pts: points[k] })).sort((a,b) => b.pts - a.pts);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '24px' }}>
      <div className="card">
        <div className="serif" style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px' }}>El día de hoy</div>
        {events.length === 0 && <div style={{ color: '#8A7560', fontSize: '14px' }}>No hay eventos para hoy.</div>}
        {events.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid #F5EFE6' }}>
            <div style={{ minWidth: '60px' }}>
              <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>{e.time}</div>
              <div style={{ fontSize: '11px', color: '#8A7560' }}>{e.duration}</div>
            </div>
            <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: family[e.who].color }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '15px' }}>{e.title}</div>
              <div style={{ fontSize: '12px', color: '#8A7560', marginTop: '2px' }}>{family[e.who].name}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #FFF8EE 0%, #FFEED1 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Trophy size={20} color="#F5B645" />
            <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>Ranking del mes</div>
          </div>
          {ranking.map((r, i) => (
            <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
              <div style={{ fontSize: '20px', width: '24px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="avatar" style={{ background: r.color, width: '28px', height: '28px', fontSize: '12px' }}>{r.initial}</div>
              <div style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{r.name}</div>
              <div className="serif" style={{ fontSize: '18px', fontWeight: 700, color: r.color }}>{r.pts}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="serif" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '14px' }}>Pendientes</div>
          {pendingTasks.length === 0 && <div style={{ color: '#8A7560', fontSize: '13px' }}>Todo listo por hoy ✨</div>}
          {pendingTasks.map(t => (
            <div key={t.id} onClick={(e) => toggleTask(t.id, e)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', cursor: 'pointer' }}>
              <div className={`checkbox ${t.done ? 'done' : ''}`}>{t.done && <Check size={16} color="#FDFAF3" strokeWidth={3} />}</div>
              <div style={{ flex: 1, fontSize: '14px' }}>{t.text}</div>
              <div className="avatar" style={{ background: family[t.who].color, width: '28px', height: '28px', fontSize: '12px' }}>{family[t.who].initial}</div>
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
  const dates = [];
  const weekDates = [];
  for (let i = -todayDow; i < 7 - todayDow; i++) {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0,0,0,0);
    dates.push(d.getDate());
    weekDates.push(d);
  }
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '32px', fontWeight: 600 }}>Esta semana</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'event', data: null })}><Plus size={16} /> Nuevo evento</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {days.map((d, i) => {
          const dayEvents = events.filter(e => appliesOn(e, weekDates[i])).sort((a,b) => a.time.localeCompare(b.time));
          const isToday = i === todayDow;
          return (
            <div key={d} style={{ background: isToday ? '#3D2E1F' : '#FBF5E9', color: isToday ? '#FDFAF3' : '#3D2E1F', borderRadius: '14px', padding: '12px 8px', minHeight: '180px' }}>
              <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: 500 }}>{d}</div>
              <div className="serif" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{dates[i]}</div>
              {dayEvents.map((e, j) => (
                <div key={j} onClick={() => isAdmin && setModal({ type: 'event', data: e })} style={{ background: isToday ? 'rgba(253,250,243,0.12)' : 'white', borderLeft: `3px solid ${family[e.who].color}`, padding: '4px 6px', borderRadius: '6px', marginBottom: '4px', cursor: isAdmin ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: '9px', opacity: 0.6 }}>{e.time}</div>
                  <div style={{ fontSize: '10px', fontWeight: 500, lineHeight: 1.2 }}>{e.title}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksView({ family, todaysTasks, toggleTask, isAdmin, setModal }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '32px', fontWeight: 600 }}>Tareas de hoy</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'task', data: null })}><Plus size={16} /> Nueva tarea</button>}
      </div>
      {todaysTasks.length === 0 && <div style={{ color: '#8A7560', padding: '12px 0' }}>Sin tareas para hoy.</div>}
      {todaysTasks.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderBottom: '1px solid #F5EFE6', opacity: t.done ? 0.5 : 1 }}>
          <div onClick={(e) => toggleTask(t.id, e)} className={`checkbox ${t.done ? 'done' : ''}`} style={{ cursor: 'pointer' }}>{t.done && <Check size={16} color="#FDFAF3" strokeWidth={3} />}</div>
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={(e) => toggleTask(t.id, e)}>
            <div style={{ fontSize: '15px', fontWeight: 500, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              {t.time && <div style={{ fontSize: '12px', color: '#8A7560' }}>⏰ {t.time}</div>}
              <div className="recurrence-badge"><Repeat size={10} />{recurrenceLabel(t.recurrence)}</div>
            </div>
          </div>
          <div className="avatar" style={{ background: family[t.who].color }}>{family[t.who].initial}</div>
          {isAdmin && <button onClick={() => setModal({ type: 'task', data: t })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#8A7560' }}><Edit2 size={16} /></button>}
        </div>
      ))}
    </div>
  );
}

function RoutinesView({ family, routines, todaysRoutinesFor, toggleRoutine, points, isAdmin, setModal, viewFilter }) {
  const ranking = ['juani','delfi','fran'].map(k => ({ k, ...family[k], pts: points[k] })).sort((a,b) => b.pts - a.pts);
  const visibleKids = viewFilter === 'all' ? ['juani','delfi','fran'] : (['juani','delfi','fran'].includes(viewFilter) ? [viewFilter] : []);

  return (
    <div>
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #FFF8EE 0%, #FFE8D6 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Trophy size={28} color="#F5B645" />
          <div className="serif" style={{ fontSize: '28px', fontWeight: 600 }}>Ranking del mes</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '12px', alignItems: 'end' }}>
          {[ranking[1], ranking[0], ranking[2]].map((r, idx) => {
            const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
            const heights = { 1: 140, 2: 100, 3: 80 };
            const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
            return (
              <div key={r.k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{medals[place]}</div>
                <div className="avatar" style={{ background: r.color, width: '56px', height: '56px', fontSize: '22px', margin: '0 auto 8px' }}>{r.initial}</div>
                <div className="serif" style={{ fontSize: '18px', fontWeight: 700 }}>{r.name}</div>
                <div className="serif" style={{ fontSize: '32px', fontWeight: 700, color: r.color }}>{r.pts}</div>
                <div style={{ fontSize: '11px', color: '#8A7560', marginBottom: '8px' }}>puntos</div>
                <div style={{ background: r.color, height: `${heights[place]}px`, borderRadius: '12px 12px 0 0', opacity: 0.85 }}/>
              </div>
            );
          })}
        </div>
      </div>

      <div className="serif" style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px' }}>Rutinas de hoy</div>
      {visibleKids.length === 0 && <div style={{ color: '#8A7560' }}>Seleccioná un menor en el filtro de arriba.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {visibleKids.filter(k => k !== 'fran').map(kid => {
          const m = family[kid];
          const r = todaysRoutinesFor(kid);
          const done = r.filter(i => i.done).length;
          return (
            <div key={kid} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div className="avatar" style={{ background: m.color, width: '44px', height: '44px', fontSize: '18px' }}>{m.initial}</div>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: '22px', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: '#8A7560' }}>{done} de {r.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif" style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{points[kid]}</div>
                  <div style={{ fontSize: '10px', color: '#8A7560' }}>puntos</div>
                </div>
              </div>
              <div style={{ height: '6px', background: '#F5EFE6', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ width: r.length ? `${(done / r.length) * 100}%` : '0%', height: '100%', background: m.color, transition: 'width 0.4s ease' }}/>
              </div>
              {r.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '6px', borderRadius: '12px', background: item.done ? '#FBF5E9' : 'transparent' }}>
                  <div onClick={(e) => toggleRoutine(kid, item.id, e)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px' }}>{item.icon}</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.5 : 1 }}>{item.text}</div>
                    <div className={`checkbox ${item.done ? 'done' : ''}`} style={{ width: '24px', height: '24px' }}>{item.done && <Check size={14} color="#FDFAF3" strokeWidth={3} />}</div>
                  </div>
                  {isAdmin && <button onClick={() => setModal({ type: 'routine', member: kid, data: item })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A7560' }}><Edit2 size={14} /></button>}
                </div>
              ))}
              {isAdmin && <button onClick={() => setModal({ type: 'routine', member: kid, data: null })} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'transparent', border: '1.5px dashed #D4C5B0', borderRadius: '12px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Plus size={14} /> Agregar paso</button>}
            </div>
          );
        })}

        {visibleKids.includes('fran') && (
          <div className="card" style={{ background: '#FFF8EE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div className="avatar" style={{ background: family.fran.color, width: '44px', height: '44px', fontSize: '18px' }}>F</div>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: '22px', fontWeight: 600 }}>Fran</div>
                <div style={{ fontSize: '12px', color: '#8A7560' }}>{todaysRoutinesFor('fran').filter(i => i.done).length} de {todaysRoutinesFor('fran').length}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="serif" style={{ fontSize: '20px', fontWeight: 700, color: family.fran.color }}>{points.fran}</div>
                <div style={{ fontSize: '10px', color: '#8A7560' }}>puntos</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {todaysRoutinesFor('fran').map(item => (
                <div key={item.id} style={{ position: 'relative' }}>
                  <div onClick={(e) => toggleRoutine('fran', item.id, e)} style={{ aspectRatio: '1', background: item.done ? family.fran.color : 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${item.done ? family.fran.color : '#F5EFE6'}` }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: item.done ? 'white' : '#3D2E1F' }}>{item.label}</div>
                    {item.done && <Check size={18} color="white" strokeWidth={3} style={{ marginTop: '4px' }} />}
                  </div>
                  {isAdmin && <button onClick={() => setModal({ type: 'routine', member: 'fran', data: item })} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7560' }}><Edit2 size={12} /></button>}
                </div>
              ))}
              {isAdmin && <button onClick={() => setModal({ type: 'routine', member: 'fran', data: null })} style={{ aspectRatio: '1', background: 'transparent', border: '2px dashed #D4C5B0', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8A7560', fontFamily: 'inherit' }}><Plus size={28} /><div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px' }}>Agregar</div></button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobsView({ family, bigJobs, todaysJobs, submitJob, validateJob, rejectJob, money, points, isAdmin, setModal }) {
  const pending = todaysJobs.filter(j => j.status === 'pending');
  const review = todaysJobs.filter(j => j.status === 'review');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {['juani','delfi','fran'].map(k => {
          const m = family[k];
          return (
            <div key={k} className="card" style={{ background: `linear-gradient(135deg, ${m.color}15 0%, ${m.color}30 100%)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="avatar" style={{ background: m.color, width: '44px', height: '44px', fontSize: '18px' }}>{m.initial}</div>
                <div className="serif" style={{ fontSize: '22px', fontWeight: 600 }}>{m.name}</div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8A7560', fontWeight: 600 }}><Star size={12} style={{ display: 'inline' }}/> PUNTOS</div>
                  <div className="serif" style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{points[k]}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8A7560', fontWeight: 600 }}><DollarSign size={12} style={{ display: 'inline' }}/> DINERO</div>
                  <div className="serif" style={{ fontSize: '26px', fontWeight: 700 }}>{formatMoney(money[k])}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '32px', fontWeight: 600 }}>Trabajos de hoy</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'job', data: null })}><Plus size={16} /> Nuevo trabajo</button>}
      </div>

      {review.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #FFF4E0 0%, #FFE9C7 100%)', border: '2px solid #F5B645' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={20} color="#E8804F" />
            <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>Esperando validación</div>
            <Lock size={14} color="#8A7560" style={{ marginLeft: 'auto' }} />
            <span style={{ fontSize: '11px', color: '#8A7560' }}>Requiere PIN</span>
          </div>
          {review.map(j => (
            <div key={j.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '32px' }}>{j.icon}</div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 600 }}>{j.title}</div>
                <div style={{ fontSize: '12px', color: '#8A7560' }}>{family[j.who].name} marcó como hecho</div>
              </div>
              <div className="serif" style={{ fontSize: '18px', fontWeight: 700, color: j.reward.type === 'money' ? '#7BA05B' : '#F5B645' }}>
                {j.reward.type === 'money' ? formatMoney(j.reward.value) : `${j.reward.value} pts`}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ghost" onClick={() => rejectJob(j.id)}>Rechazar</button>
                <button className="btn-success" onClick={(e) => validateJob(j.id, e)}><Check size={14} /> Aprobar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="serif" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '14px' }}>Asignados ({pending.length})</div>
        {pending.length === 0 && <div style={{ color: '#8A7560', padding: '12px 0' }}>No hay trabajos pendientes hoy.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {pending.map(j => {
            const m = family[j.who];
            return (
              <div key={j.id} style={{ background: '#FBF5E9', borderRadius: '16px', padding: '18px', borderLeft: `4px solid ${m.color}`, position: 'relative' }}>
                {isAdmin && <button onClick={() => setModal({ type: 'job', data: j })} style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#8A7560' }}><Edit2 size={14} /></button>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '32px' }}>{j.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{j.title}</div>
                    <div style={{ fontSize: '12px', color: '#8A7560' }}>{m.name} · {j.deadline}</div>
                  </div>
                </div>
                {j.notes && <div style={{ fontSize: '13px', color: '#8A7560', fontStyle: 'italic', marginBottom: '12px', padding: '8px 10px', background: 'white', borderRadius: '8px' }}>"{j.notes}"</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: j.reward.type === 'money' ? '#5C7D42' : '#A67C12' }}>
                    {j.reward.type === 'money' ? formatMoney(j.reward.value) : `${j.reward.value} pts`}
                  </div>
                  <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={(e) => submitJob(j.id, e)}>Marcar hecho</button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="serif" style={{ fontSize: '32px', fontWeight: 600 }}>Listas compartidas</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal({ type: 'list', data: null })}><Plus size={16} /> Nueva lista</button>}
      </div>
      {lists.length === 0 && <div style={{ color: '#8A7560', padding: '40px 0', textAlign: 'center' }}>No hay listas todavía. {isAdmin && 'Creá la primera con "+ Nueva lista".'}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {lists.map(l => {
          const done = l.items.filter(i => i.done).length;
          const allDone = l.items.length > 0 && done === l.items.length;
          return (
            <div key={l.id} className="card" style={allDone ? { opacity: 0.7, background: '#FBF5E9' } : {}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px' }}>{l.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: '12px', color: allDone ? '#7BA05B' : '#8A7560', fontWeight: allDone ? 600 : 400 }}>
                    {allDone ? '✓ Completa' : `${done} de ${l.items.length}`}
                  </div>
                </div>
                {isAdmin && <button onClick={() => setModal({ type: 'list', data: l })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A7560' }}><Edit2 size={16} /></button>}
              </div>
              <div>
                {l.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                    <div onClick={(e) => toggleListItem(l.id, item.id, e)} className={`checkbox ${item.done ? 'done' : ''}`} style={{ width: '22px', height: '22px', cursor: 'pointer' }}>{item.done && <Check size={14} color="#FDFAF3" strokeWidth={3} />}</div>
                    <div style={{ flex: 1, fontSize: '14px', textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.5 : 1, cursor: 'pointer' }} onClick={(e) => toggleListItem(l.id, item.id, e)}>{item.text}</div>
                    <button onClick={() => deleteListItem(l.id, item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#C0392B', opacity: 0.4 }}><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {isAdmin && <button onClick={() => setModal({ type: 'listItem', listId: l.id, data: null })} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1.5px dashed #D4C5B0', borderRadius: '10px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Plus size={14} /> Item</button>}
                {done > 0 && <button onClick={() => clearCompletedItems(l.id)} style={{ padding: '8px 12px', background: '#F5EFE6', border: 'none', borderRadius: '10px', color: '#8A7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><RotateCcw size={12} /> Limpiar tildados</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryView({ family, history, tasks, bigJobs, routines, viewFilter }) {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = viewFilter === 'all' ? sorted : sorted.filter(h => h.who === viewFilter);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthHist = history.filter(h => h.date.startsWith(currentMonth));
  const stats = ['juani','delfi','fran'].map(k => {
    const kidHist = monthHist.filter(h => h.who === k);
    return {
      k, ...family[k],
      routinesDone: kidHist.filter(h => h.kind === 'routine').length,
      jobsDone: kidHist.filter(h => h.kind === 'job').length,
      moneyEarned: kidHist.reduce((s, h) => s + (h.money || 0), 0),
      pointsEarned: kidHist.reduce((s, h) => s + (h.points || 0), 0),
    };
  });

  const getTitle = (h) => {
    if (h.title) return h.title;
    if (h.kind === 'task') return tasks.find(t => t.id === h.templateId)?.text || '?';
    if (h.kind === 'job') return bigJobs.find(j => j.id === h.templateId)?.title || '?';
    if (h.kind === 'routine') {
      const r = routines[h.who]?.find(rt => rt.id === h.templateId);
      return r?.text || r?.label || '?';
    }
    return '?';
  };

  const kindLabel = { task: 'Tarea', routine: 'Rutina', job: 'Trabajo' };
  const kindColor = { task: '#5B96B0', routine: '#F5B645', job: '#7BA05B' };

  return (
    <div>
      <div className="serif" style={{ fontSize: '32px', fontWeight: 600, marginBottom: '20px' }}>Historial del mes</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.k} className="card" style={{ background: `linear-gradient(135deg, ${s.color}10 0%, ${s.color}25 100%)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="avatar" style={{ background: s.color, width: '40px', height: '40px', fontSize: '16px' }}>{s.initial}</div>
              <div className="serif" style={{ fontSize: '20px', fontWeight: 600 }}>{s.name}</div>
            </div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Rutinas</span><span style={{ fontWeight: 700 }}>{s.routinesDone}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Trabajos</span><span style={{ fontWeight: 700 }}>{s.jobsDone}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Dinero</span><span style={{ fontWeight: 700, color: '#7BA05B' }}>${s.moneyEarned.toLocaleString('es-AR')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8A7560' }}>Puntos</span><span style={{ fontWeight: 700, color: s.color }}>{s.pointsEarned}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="serif" style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>Actividad reciente</div>
        {filtered.length === 0 && <div style={{ color: '#8A7560' }}>Aún no hay actividad registrada.</div>}
        {filtered.slice(0, 30).map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid #F5EFE6' }}>
            <div className="avatar" style={{ background: family[h.who].color, width: '32px', height: '32px', fontSize: '12px' }}>{family[h.who].initial}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{getTitle(h)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                <div className="pill" style={{ background: kindColor[h.kind] + '20', color: kindColor[h.kind], fontWeight: 600 }}>{kindLabel[h.kind]}</div>
                <span style={{ fontSize: '11px', color: '#8A7560' }}>{h.date}</span>
              </div>
            </div>
            {h.points && <div style={{ fontSize: '13px', fontWeight: 700, color: '#F5B645' }}>+{h.points} pts</div>}
            {h.money && <div style={{ fontSize: '13px', fontWeight: 700, color: '#7BA05B' }}>+${h.money.toLocaleString('es-AR')}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, onSave, onDelete, hasId, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="serif" style={{ fontSize: '24px', fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: '#FBF5E9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px', flexWrap: 'wrap' }}>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {Object.entries(family).map(([k, m]) => (
          <div key={k} className={`person-chip ${value === k ? 'selected' : ''}`} style={{ '--clr': m.color }} onClick={() => onChange(k)}>
            <div className="avatar" style={{ background: m.color, width: '24px', height: '24px', fontSize: '11px' }}>{m.initial}</div>
            {m.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconPicker({ icons, value, onChange }) {
  return (
    <div className="field">
      <div className="label">Ícono</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {icons.map(ic => (
          <button key={ic} type="button" className={`icon-picker-btn ${value === ic ? 'selected' : ''}`} onClick={() => onChange(ic)}>{ic}</button>
        ))}
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

  useEffect(() => {
    const r = { type, startDate };
    if (type === 'weekly') r.weekdays = weekdays;
    if (type === 'monthly') r.dayOfMonth = dayOfMonth;
    if (type === 'custom') r.interval = interval;
    onChange(r);
  }, [type, weekdays, dayOfMonth, interval, startDate]);

  const toggleWeekday = (d) => {
    setWeekdays(weekdays.includes(d) ? weekdays.filter(x => x !== d) : [...weekdays, d].sort());
  };

  const getNextOccurrences = () => {
    const tempItem = { recurrence: { type, startDate, weekdays, dayOfMonth, interval } };
    const occurrences = [];
    const start = parseKey(startDate);
    const cursor = new Date(); cursor.setHours(0,0,0,0);
    const from = cursor < start ? start : cursor;
    let check = new Date(from);
    let safety = 0;
    while (occurrences.length < 3 && safety < 365) {
      if (appliesOn(tempItem, check)) {
        occurrences.push(new Date(check));
        if (type === 'once') break;
      }
      check.setDate(check.getDate() + 1);
      safety++;
    }
    return occurrences;
  };

  const formatPreview = (d) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateKey(d) === dateKey(today)) return 'Hoy';
    if (dateKey(d) === dateKey(tomorrow)) return 'Mañana';
    return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  };

  const occurrences = getNextOccurrences();

  return (
    <div className="field">
      <div className="label">Periodicidad</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {[
          { id: 'once', label: 'Única' },
          { id: 'daily', label: 'Diaria' },
          { id: 'weekly', label: 'Semanal' },
          { id: 'monthly', label: 'Mensual' },
          { id: 'custom', label: 'Cada X días' },
        ].map(opt => (
          <div key={opt.id} className={`toggle-pill ${type === opt.id ? 'selected' : ''}`} onClick={() => setType(opt.id)} style={{ fontSize: '13px', padding: '8px 10px' }}>{opt.label}</div>
        ))}
      </div>

      {type === 'weekly' && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>Días</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6,0].map(d => (
              <div key={d} className={`day-pill ${weekdays.includes(d) ? 'selected' : ''}`} onClick={() => toggleWeekday(d)}>{DAYS_ES[d]}</div>
            ))}
          </div>
        </div>
      )}

      {type === 'monthly' && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>Día del mes</div>
          <input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="input" style={{ width: '120px' }} />
        </div>
      )}

      {type === 'custom' && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', color: '#8A7560', marginBottom: '8px' }}>Cada cuántos días</div>
          <input type="number" min="2" max="90" value={interval} onChange={(e) => setIntervalDays(Number(e.target.value))} className="input" style={{ width: '120px' }} />
        </div>
      )}

      <div style={{ marginTop: '14px', padding: '14px', background: '#FBF5E9', borderRadius: '12px' }}>
        <div className="label" style={{ marginBottom: '8px' }}>{type === 'once' ? 'Fecha' : 'Empieza el'}</div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ background: 'white' }} />
      </div>

      {occurrences.length > 0 && (
        <div style={{ marginTop: '12px', padding: '12px 14px', background: '#3D2E1F', borderRadius: '12px', color: '#FDFAF3' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, marginBottom: '8px' }}>{type === 'once' ? 'APARECERÁ' : 'PRÓXIMAS'}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {occurrences.map((d, i) => (
              <div key={i} className="serif" style={{ fontSize: '14px', fontWeight: 600, padding: '6px 12px', background: 'rgba(253,250,243,0.12)', borderRadius: '999px' }}>{formatPreview(d)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskModal({ data, family, onSave, onDelete, onClose }) {
  const [text, setText] = useState(data?.text || '');
  const [who, setWho] = useState(data?.who || 'sebas');
  const [time, setTime] = useState(data?.time || '');
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'daily', startDate: todayKey() });
  const handleSave = () => { if (text.trim()) onSave({ id: data?.id, text, who, time: time || null, recurrence }); };
  return (
    <ModalShell title={data ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Tarea</div><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: Comprar verduras" autoFocus /></div>
      <PersonPicker family={family} value={who} onChange={setWho} />
      <div className="field"><div className="label">Hora (opcional)</div><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function JobModal({ data, family, onSave, onDelete, onClose }) {
  const kids = { juani: family.juani, delfi: family.delfi, fran: family.fran };
  const [title, setTitle] = useState(data?.title || '');
  const [icon, setIcon] = useState(data?.icon || '🌱');
  const [who, setWho] = useState(data?.who || 'juani');
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
      <div className="field"><div className="label">Recompensa</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className={`toggle-pill ${rewardType === 'points' ? 'selected' : ''}`} onClick={() => setRewardType('points')}><Star size={14}/> Puntos</div>
          <div className={`toggle-pill ${rewardType === 'money' ? 'selected' : ''}`} onClick={() => setRewardType('money')}><DollarSign size={14}/> Dinero</div>
        </div>
      </div>
      <div className="field"><div className="label">{rewardType === 'money' ? 'Monto en pesos' : 'Cantidad de puntos'}</div><input className="input" type="number" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} /></div>
      <div className="field"><div className="label">Para cuándo</div><input className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Hoy, Mañana, Sábado..." /></div>
      <div className="field"><div className="label">Notas</div><textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ resize: 'vertical' }} /></div>
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function EventModal({ data, family, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(data?.title || '');
  const [time, setTime] = useState(data?.time || '12:00');
  const [duration, setDuration] = useState(data?.duration || '1h');
  const [who, setWho] = useState(data?.who || 'sebas');
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'once', startDate: todayKey() });
  const handleSave = () => { if (title.trim()) onSave({ id: data?.id, title, time, duration, who, recurrence }); };
  return (
    <ModalShell title={data ? 'Editar evento' : 'Nuevo evento'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Título</div><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Yoga, Reunión, Cumple" autoFocus /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="field"><div className="label">Hora</div><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        <div className="field"><div className="label">Duración</div><input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1h, 30m" /></div>
      </div>
      <PersonPicker family={family} value={who} onChange={setWho} label="Quién" />
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function RoutineModal({ data, member, memberData, onSave, onDelete, onClose }) {
  const isFran = member === 'fran';
  const [text, setText] = useState(data?.text || data?.label || '');
  const [icon, setIcon] = useState(data?.icon || (isFran ? '👕' : '🛏️'));
  const [recurrence, setRecurrence] = useState(data?.recurrence || { type: 'daily', startDate: todayKey() });
  const handleSave = () => {
    if (!text.trim()) return;
    if (isFran) onSave({ id: data?.id, label: text, icon, recurrence });
    else onSave({ id: data?.id, text, icon, recurrence });
  };
  return (
    <ModalShell title={`${data ? 'Editar' : 'Nuevo'} paso · ${memberData.name}`} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">{isFran ? 'Etiqueta' : 'Paso'}</div><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={isFran ? 'Vestirse' : 'Tender la cama'} autoFocus /></div>
      <IconPicker icons={['👕','🥣','🪥','💆','🧴','🧥','🛏️','🥐','🎒','🎸','👟','📚','🚿','🧦','🍎','🎨','📝']} value={icon} onChange={setIcon} />
      <RecurrencePicker recurrence={recurrence} onChange={setRecurrence} />
    </ModalShell>
  );
}

function ListModal({ data, onSave, onDelete, onClose }) {
  const [name, setName] = useState(data?.name || '');
  const [icon, setIcon] = useState(data?.icon || '📝');
  const handleSave = () => { if (name.trim()) onSave({ id: data?.id, name, icon }); };
  return (
    <ModalShell title={data ? 'Editar lista' : 'Nueva lista'} onClose={onClose} onSave={handleSave} onDelete={data ? () => onDelete(data.id) : null} hasId={!!data}>
      <div className="field"><div className="label">Nombre</div><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Compras, viaje, cumple..." autoFocus /></div>
      <IconPicker icons={['🛒','🏖️','🎂','📝','🧳','🎁','🍳','🏠','💊','📚','🎉','✈️','🏥']} value={icon} onChange={setIcon} />
    </ModalShell>
  );
}

function ListItemModal({ data, onSave, onClose }) {
  const [text, setText] = useState(data?.text || '');
  const handleSave = () => { if (text.trim()) onSave({ id: data?.id, text }); };
  return (
    <ModalShell title="Agregar item" onClose={onClose} onSave={handleSave} hasId={!!data}>
      <div className="field"><div className="label">Item</div><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: Tomates" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} /></div>
    </ModalShell>
  );
}