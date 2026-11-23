export const STORAGE_KEY = 'repbook.v1';
export const catalog = ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Overhead Press', 'Lateral Raise', 'Tricep Pushdown', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'Face Pull', 'Bicep Curl', 'Hammer Curl', 'Barbell Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Leg Extension', 'Calf Raise', 'Deadlift', 'Pull Up', 'Push Up', 'Plank'];
export const routines = [
  { id: 'push', name: 'Push day', group: 'CHEST · SHOULDERS · TRICEPS', description: 'Dorong batas lo, satu set lagi.', exercises: catalog.slice(0, 6), color: 'lime', icon: 'dumbbell', minutes: 55 },
  { id: 'pull', name: 'Pull day', group: 'BACK · BICEPS', description: 'Bangun punggung yang lebih kuat.', exercises: catalog.slice(6, 12), color: 'lavender', icon: 'activity', minutes: 50 },
  { id: 'legs', name: 'Leg day', group: 'QUADS · HAMSTRINGS · CALVES', description: 'Fondasi kuat, progres lebih jauh.', exercises: catalog.slice(12, 18), color: 'peach', icon: 'bolt', minutes: 60 }
];
export const freshState = () => ({ version: 1, sessions: [], active: null, weeklyGoal: 4 });
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const uid = () => globalThis.crypto.randomUUID();
export const volume = session => session.exercises.reduce((total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0), 0);
export function normalizeAthleteName(value) {
  if(typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) throw new Error('Isi nama yang valid sebelum menyimpan latihan.');
  const name=value.normalize('NFC').trim().replace(/\s+/g,' ');
  if(!name || name.length>60) throw new Error('Nama wajib diisi, maksimal 60 karakter.');
  return name;
}
export const athleteKey = name => name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('id-ID');
export const athleteLabel = session => session.athleteName || 'Tanpa nama';
export const filterAthlete = (sessions,name) => name?sessions.filter(s=>athleteKey(athleteLabel(s))===athleteKey(name)):sessions;
export function completeSession(active,athleteName,now=Date.now()) {
  if(!active) throw new Error('Tidak ada sesi aktif.');
  const exercises=active.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done)})).filter(e=>e.sets.length);
  if(!exercises.length)throw new Error('Centang minimal satu set yang sudah selesai.');
  const session={...active,athleteName:normalizeAthleteName(athleteName),exercises,duration:Math.max(0,Math.round((now-Date.parse(active.startedAt))/1000))};
  validateState({...freshState(),sessions:[session]});
  return session;
}
export function weekDates(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - (monday.getDay()+6)%7);
  return Array.from({length:7}, (_,i) => {const d = new Date(monday); d.setDate(d.getDate()+i); return localDate(d);});
}
export function validateState(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.sessions) || data.sessions.length > 10000 || !Number.isInteger(data.weeklyGoal) || data.weeklyGoal < 1 || data.weeklyGoal > 7) throw new Error('Format backup tidak sesuai Repbook v1.');
  const ids = new Set();
  const checkSession = (s, active = false) => {
    if(s?.athleteName !== undefined) normalizeAthleteName(s.athleteName);
    if (!s || typeof s.id !== 'string' || ids.has(s.id) || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || !Number.isFinite(Date.parse(s.date)) || new Date(s.date).toISOString().slice(0,10) !== s.date || !Number.isFinite(Date.parse(s.startedAt)) || (!active && (!Number.isFinite(s.duration) || s.duration < 0)) || !Array.isArray(s.exercises) || s.exercises.length > 100 || (!active && !s.exercises.length)) throw new Error('Data sesi latihan tidak valid.');
    ids.add(s.id);
    for (const e of s.exercises) {
      if (typeof e.name !== 'string' || !e.name.trim() || e.name.length > 100 || !Array.isArray(e.sets) || e.sets.length > 100 || (!active && !e.sets.length)) throw new Error('Data gerakan tidak valid.');
      for (const set of e.sets) if (!Number.isFinite(set.weight) || set.weight < 0 || set.weight > 2000 || !Number.isInteger(set.reps) || set.reps < (active ? 0 : 1) || set.reps > 10000 || typeof set.done !== 'boolean') throw new Error('Beban atau repetisi tidak valid.');
    }
  };
  data.sessions.forEach(s => checkSession(s));
  if (data.active !== null) checkSession(data.active, true);
  return { version: 1, weeklyGoal: data.weeklyGoal, sessions: data.sessions, active: data.active };
}
