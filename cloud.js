import { freshState, validateState, normalizeAthleteName } from './core.js';

export function validatePublicConfig(config) {
  if (!config.url && !config.publishableKey) return false;
  if (!config.url || !config.publishableKey) throw new Error('Isi Project URL dan publishable key di config.js.');
  const url = new URL(config.url);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Project URL harus berupa alamat HTTPS Supabase.');
  const key = config.publishableKey;
  if (key.startsWith('sb_publishable_')) return true;
  try {const claim=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(claim.role==='anon')return true;} catch { /* Not a legacy anon JWT. */ }
  throw new Error('Gunakan publishable key (sb_publishable_…) atau anon key. Secret/service_role key tidak boleh dipakai di web.');
}

export async function connectSupabase(config) {
  validatePublicConfig(config);
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=new URL('./vendor/supabase.js',import.meta.url).href;
    script.onload=resolve;script.onerror=()=>reject(new Error('SDK Supabase gagal dimuat. Pastikan folder vendor ikut di-upload.'));
    document.head.append(script);
  });
  return globalThis.supabase.createClient(config.url,config.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},
    global:{fetch:(input,options={})=>fetch(input,{...options,signal:options.signal||AbortSignal.timeout(20000)})}
  });
}

export function cloudError(error) {
  if (error?.code==='42P01' || error?.code==='PGRST205') return 'Tabel Supabase belum siap. Jalankan supabase/schema.sql di SQL Editor.';
  if (error?.code==='42501') return 'Akses data ditolak. Periksa login, GRANT, dan kebijakan RLS Supabase.';
  if (error?.status===401 || error?.code==='PGRST301') return 'Sesi login berakhir. Masuk lagi untuk menyimpan latihan.';
  return 'Belum bisa terhubung ke Supabase. Coba sinkronkan lagi; draft latihan tetap di perangkat ini.';
}

// One database row per finished session: two phones never replace each other's full history.
export function createRepository(client,accountId) {
  if (!accountId) throw new Error('Login diperlukan.');
  const checked = session => {
    const athleteName=normalizeAthleteName(session.athleteName);
    const result={...session,athleteName};
    validateState({...freshState(),sessions:[result]});
    return result;
  };
  return {
    async load() {
      const sessions=[];
      for(let offset=0; ;offset+=500) {
        const {data,error}=await client.from('repbook_sessions').select('session').eq('account_id',accountId).order('created_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+499);
        if(error)throw error;
        sessions.push(...data.map(row=>checked(row.session)));
        if(sessions.length>10000)throw new Error('Batas 10.000 sesi terlampaui.');
        if(data.length<500)break;
      }
      const {data,error}=await client.from('repbook_preferences').select('weekly_goal').eq('account_id',accountId).maybeSingle();
      if(error)throw error;
      const weeklyGoal=data?.weekly_goal??4;
      validateState({...freshState(),sessions,weeklyGoal});
      return {sessions,weeklyGoal};
    },
    async save(session) {
      const item=checked(session);
      const {error}=await client.from('repbook_sessions').upsert({account_id:accountId,id:item.id,session:item},{onConflict:'account_id,id'});
      if(error)throw error;
      return item;
    },
    async remove(id) {
      const {error}=await client.from('repbook_sessions').delete().eq('account_id',accountId).eq('id',id);
      if(error)throw error;
    },
    async setGoal(weeklyGoal) {
      if(!Number.isInteger(weeklyGoal)||weeklyGoal<1||weeklyGoal>7)throw new Error('Target harus 1–7 sesi.');
      const {error}=await client.from('repbook_preferences').upsert({account_id:accountId,weekly_goal:weeklyGoal},{onConflict:'account_id'});
      if(error)throw error;
    },
    async importSessions(sessions,fallbackName) {
      const prepared=sessions.map(session=>checked({...session,athleteName:session.athleteName||fallbackName}));
      // Single atomic request: an invalid backup cannot leave a half-imported history.
      if(prepared.length){const {error}=await client.from('repbook_sessions').upsert(prepared.map(session=>({account_id:accountId,id:session.id,session})),{onConflict:'account_id,id'});if(error)throw error;}
    }
  };
}
